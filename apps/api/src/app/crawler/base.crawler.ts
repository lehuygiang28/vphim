/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpService } from '@nestjs/axios';
import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import slugify from 'slugify';
import { removeDiacritics, removeTone } from '@vn-utils/text';
import { Movie as OPhimMovie } from 'ophim-js';

import { RedisService } from '../../libs/modules/redis';
import { MovieRepository } from '../movies/movie.repository';
import { ActorRepository } from '../actors';
import { CategoryRepository } from '../categories';
import { DirectorRepository } from '../directors';
import { RegionRepository } from '../regions/region.repository';
import { Episode, EpisodeServerData, Movie } from '../movies/movie.schema';
import { isNullOrUndefined, resolveUrl, sleep, slugifyVietnamese } from '../../libs/utils/common';
import { mappingNameSlugEpisode } from './mapping-data';
import { TmdbService } from 'apps/api/src/libs/modules/themoviedb.org/tmdb.service';
import { ImdbType, TmdbType } from '../movies/movie.type';
import { CrawlerSettingsRepository } from './dto/crawler-settings.repository';
import { CrawlerSettings, CrawlerType } from './dto/crawler-settings.schema';

export interface ICrawlerConfig {
    type: CrawlerType;
    name: string;
    host: string;
    cronSchedule: string;
    forceUpdate: boolean;
    imgHost?: string;
    maxRetries?: number;
    rateLimitDelay?: number;
    maxConcurrentRequests?: number;
    maxContinuousSkips?: number;
    enabled?: boolean;
}

export interface ICrawlerDependencies {
    config: ICrawlerConfig;
    configService: ConfigService;
    redisService: RedisService;
    httpService: HttpService;
    movieRepo: MovieRepository;
    actorRepo: ActorRepository;
    categoryRepo: CategoryRepository;
    directorRepo: DirectorRepository;
    regionRepo: RegionRepository;
    tmdbService: TmdbService;
    crawlerSettingsRepo?: CrawlerSettingsRepository;
}

export interface ICrawlerStatus {
    isRunning: boolean;
    lastRun?: Date;
    currentPage?: number;
    totalPages?: number;
    processedItems: number;
    failedItems: number;
    startTime?: Date;
    endTime?: Date;
    error?: string;
}

export abstract class BaseCrawler implements OnModuleInit, OnModuleDestroy {
    protected readonly logger: Logger;
    protected readonly RETRY_DELAY = 5000;
    protected readonly REVALIDATION_BATCH_SIZE = 40;
    protected moviesToRevalidate: string[] = [];

    private _config: ICrawlerConfig;
    protected get config(): ICrawlerConfig {
        return this._config;
    }

    protected readonly configService: ConfigService;
    protected readonly redisService: RedisService;
    protected readonly httpService: HttpService;
    protected readonly movieRepo: MovieRepository;
    protected readonly actorRepo: ActorRepository;
    protected readonly categoryRepo: CategoryRepository;
    protected readonly directorRepo: DirectorRepository;
    protected readonly regionRepo: RegionRepository;
    protected readonly tmdbService: TmdbService;

    private isCrawling = false;
    private status: ICrawlerStatus = {
        isRunning: false,
        processedItems: 0,
        failedItems: 0,
    };
    private requestQueue: Promise<void>[] = [];
    private activeRequests = 0;
    private continuousSkips = 0;

    constructor(protected readonly dependencies: ICrawlerDependencies) {
        this.logger = new Logger(this.constructor.name);
        this._config = { ...dependencies.config };
        this.configService = dependencies.configService;
        this.redisService = dependencies.redisService;
        this.httpService = dependencies.httpService;
        this.movieRepo = dependencies.movieRepo;
        this.actorRepo = dependencies.actorRepo;
        this.categoryRepo = dependencies.categoryRepo;
        this.directorRepo = dependencies.directorRepo;
        this.regionRepo = dependencies.regionRepo;
        this.tmdbService = dependencies.tmdbService;

        this.validateConfig(this._config);
    }

    private validateConfig(config: ICrawlerConfig) {
        if (!config.name) throw new Error('Crawler name is required');
        if (!config.host) throw new Error('Crawler host is required');
        if (!config.cronSchedule) throw new Error('Crawler cron schedule is required');
        if (typeof config.forceUpdate !== 'boolean')
            throw new Error('forceUpdate must be a boolean');
    }

    private async enqueueRequest<T>(request: () => Promise<T>): Promise<T> {
        while (this.activeRequests >= this.config.maxConcurrentRequests) {
            await sleep(100);
        }

        this.activeRequests++;
        try {
            await sleep(this.config.rateLimitDelay);
            return await request();
        } finally {
            this.activeRequests--;
        }
    }

    /**
     * Check if this crawler is enabled based on configuration.
     * Override this method to implement custom enable/disable logic.
     * By default, checks:
     * 1. Global DISABLE_CRAWL flag
     * 2. EXCLUDE_MOVIE_SRC list
     * 3. Crawler-specific disable flag (DISABLE_[NAME]_CRAWL)
     */
    protected isEnabled(): boolean {
        // Check global crawler disable flag
        const disableCrawl = this.configService.get<string>('DISABLE_CRAWL');
        if (disableCrawl === 'true') {
            return false;
        }

        // Check excluded movie sources
        const excludedSources = this.configService.get<string>('EXCLUDE_MOVIE_SRC');
        if (excludedSources) {
            const excludedList = excludedSources.split(',').map((s) => s.trim().toLowerCase());
            if (excludedList.includes(this.config.name.toLowerCase())) {
                return false;
            }
        }

        // Check specific crawler disable flag
        const specificDisableFlag = this.configService.get<string>(
            `DISABLE_${this.config.name.toUpperCase()}_CRAWL`,
        );
        if (specificDisableFlag === 'true') {
            return false;
        }

        return this.shouldEnable();
    }

    /**
     * Override this method to implement custom enable/disable logic for specific crawlers.
     * This will be called after checking the standard disable flags.
     * @returns boolean - true if the crawler should be enabled, false otherwise
     */
    protected abstract shouldEnable(): boolean;

    /**
     * Helper method to load crawler settings from repository or cache
     */
    protected async loadCrawlerSettings(): Promise<CrawlerSettings | null> {
        if (!this.dependencies.crawlerSettingsRepo) {
            return null;
        }

        try {
            // Use a cache key to store crawler settings
            const cacheKey = `CACHED:CRAWLER_CONFIG:${this.config.name}`;

            // Try to get settings from cache first
            let dbSettings = await this.redisService.get<CrawlerSettings>(cacheKey);

            // If not in cache, fetch from database
            if (!dbSettings) {
                dbSettings = await this.dependencies.crawlerSettingsRepo.findOne({
                    filterQuery: { name: this.config.name },
                });

                // If found in database, cache it
                if (dbSettings) {
                    await this.redisService.set(cacheKey, dbSettings, 60 * 60); // 1 hour cache
                }
            }

            return dbSettings;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error loading crawler settings: ${errorMessage}`);
            return null;
        }
    }

    /**
     * Helper method to create default settings
     */
    protected async createDefaultSettings(): Promise<CrawlerSettings | null> {
        if (!this.dependencies.crawlerSettingsRepo) {
            return null;
        }

        try {
            const defaultSettings = await this.dependencies.crawlerSettingsRepo.create({
                document: {
                    ...this.config,
                    enabled: true,
                },
            });

            // Cache the new settings
            if (defaultSettings) {
                const cacheKey = `CACHED:CRAWLER_CONFIG:${this.config.name}`;
                await this.redisService.set(cacheKey, defaultSettings, 60 * 60);
            }

            return defaultSettings;
        } catch (error) {
            // Check if it's a duplicate key error (likely concurrent creation)
            if (error.code === 11000 || error.name === 'MongoServerError') {
                this.logger.warn(
                    `Duplicate key error when creating settings for ${this.config.name}, another instance may have created it first`,
                );

                // Try to load the settings again
                return await this.loadCrawlerSettings();
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.logger.error(`Failed to create default crawler settings: ${errorMessage}`);
                return null;
            }
        }
    }

    /**
     * Apply settings from database to config
     */
    protected applySettings(dbSettings: CrawlerSettings): void {
        if (!dbSettings) return;

        this._config = {
            ...this._config,
            host: dbSettings.host || this._config.host,
            cronSchedule: dbSettings.cronSchedule || this._config.cronSchedule,
            forceUpdate: dbSettings.forceUpdate ?? this._config.forceUpdate,
            imgHost: dbSettings.imgHost || this._config.imgHost,
            maxRetries: dbSettings.maxRetries || this._config.maxRetries,
            rateLimitDelay: dbSettings.rateLimitDelay || this._config.rateLimitDelay,
            maxConcurrentRequests:
                dbSettings.maxConcurrentRequests || this._config.maxConcurrentRequests,
            maxContinuousSkips: dbSettings.maxContinuousSkips || this._config.maxContinuousSkips,
            enabled: dbSettings.enabled ?? true,
        };
    }

    /**
     * Check if crawler was auto-stopped
     */
    protected async wasAutoStopped(): Promise<{ stopped: boolean; hoursSinceStop?: number }> {
        try {
            const autoStopKey = `crawler:${this.config.name}:auto-stopped`;
            const lastStopTime = await this.redisService.get<string>(autoStopKey);

            if (lastStopTime) {
                const stopTime = new Date(lastStopTime);
                const hoursSinceStop =
                    (new Date().getTime() - stopTime.getTime()) / (1000 * 60 * 60);

                // If it's been less than 20 hours since auto-stop, don't restart
                if (hoursSinceStop < 20) {
                    return { stopped: true, hoursSinceStop };
                } else {
                    // Clear the auto-stop flag since enough time has passed
                    await this.redisService.del(autoStopKey);
                    return { stopped: false };
                }
            }

            return { stopped: false };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error checking auto-stop status: ${errorMessage}`);
            return { stopped: false };
        }
    }

    /**
     * Mark crawler as auto-stopped
     */
    protected async markAutoStopped(): Promise<void> {
        try {
            const autoStopKey = `crawler:${this.config.name}:auto-stopped`;
            await this.redisService.set(autoStopKey, new Date().toISOString(), 60 * 60 * 24 * 2); // 48 hour TTL
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to set auto-stop flag: ${errorMessage}`);
        }
    }

    /**
     * Initialize the crawler by loading configuration from the database
     * Scheduling is now handled by BullMQ, so we just load settings here
     */
    async onModuleInit() {
        this.logger.log(`Initializing crawler for ${this.config.name}`);

        // Check for settings in database if repository is available
        if (this.dependencies.crawlerSettingsRepo) {
            try {
                // Load settings from repository or cache
                let dbSettings = await this.loadCrawlerSettings();

                if (dbSettings) {
                    this.logger.log(`Found settings for ${this.config.name}`);

                    // Apply database settings to the config
                    this.applySettings(dbSettings);
                } else {
                    this.logger.log(
                        `No settings found for ${this.config.name}, creating default entry`,
                    );

                    // Create default settings in DB
                    dbSettings = await this.createDefaultSettings();

                    if (dbSettings) {
                        this.applySettings(dbSettings);
                    }
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                const errorStack = error instanceof Error ? error.stack : undefined;
                this.logger.error(
                    `Error loading crawler settings from database: ${errorMessage}`,
                    errorStack,
                );
            }
        }
    }

    onModuleDestroy() {
        // Nothing to clean up - scheduler is handled by BullMQ
    }

    /**
     * Update crawler configuration without handling scheduling
     * Scheduling is now managed by BullMQ, so we just update local config
     */
    public async updateCrawlerConfig(): Promise<boolean> {
        try {
            this.logger.log(`Updating configuration for crawler ${this.config.name}`);

            // Load latest settings from database
            if (this.dependencies.crawlerSettingsRepo) {
                const dbSettings = await this.loadCrawlerSettings();
                if (dbSettings) {
                    this.logger.log(`Loaded updated settings for ${this.config.name}`);
                    this.applySettings(dbSettings);
                    return true;
                }
            }

            return false;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            this.logger.error(`Error updating crawler configuration: ${errorMessage}`, errorStack);
            return false;
        }
    }

    /**
     * Trigger a crawl operation manually or programmatically
     * This method can be called directly or through a job processor
     */
    public async triggerCrawl(slug?: string): Promise<void> {
        if (this.isCrawling) {
            this.logger.warn(`Crawler ${this.config.name} is already running, ignoring trigger`);
            return;
        }

        this.logger.log(
            `Triggering crawler ${this.config.name}${slug ? ` for slug: ${slug}` : ''}`,
        );

        // Don't run if the crawler is not enabled
        if (!this.isEnabled()) {
            this.logger.log(`Crawler ${this.config.name} is disabled by configuration`);
            return;
        }

        // Check if the crawler was auto-stopped due to continuous skips
        const autoStopStatus = await this.wasAutoStopped();
        if (autoStopStatus.stopped && autoStopStatus.hoursSinceStop !== undefined) {
            this.logger.warn(
                `Crawler ${this.config.name} was auto-stopped ${Math.round(
                    autoStopStatus.hoursSinceStop,
                )} hours ago. Will not restart until 20 hours have passed.`,
            );
            return;
        }

        try {
            // Reset skip count
            this.resetSkipCount();

            // If slug is provided, just fetch and save that movie
            if (slug) {
                await this.fetchAndSaveMovieDetail(slug);
            } else {
                // Otherwise, start crawling
                this.isCrawling = true;
                this.status = {
                    isRunning: true,
                    startTime: new Date(),
                    processedItems: 0,
                    failedItems: 0,
                };

                await this.crawl();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error triggering crawler: ${errorMessage}`);
        }
    }

    /**
     * Stop the crawler
     */
    public stopCrawler(): void {
        this.logger.log(`Manually stopping crawler ${this.config.name}`);
        this.isCrawling = false;
        this.status.isRunning = false;
        this.status.endTime = new Date();
    }

    /**
     * Resume a previously stopped crawler
     */
    public async resumeCrawler(): Promise<void> {
        if (this.isCrawling) {
            this.logger.warn(
                `Crawler ${this.config.name} is already running, ignoring resume request`,
            );
            return;
        }

        // Check if the crawler was auto-stopped due to continuous skips
        const autoStopStatus = await this.wasAutoStopped();
        if (autoStopStatus.stopped && autoStopStatus.hoursSinceStop !== undefined) {
            this.logger.warn(
                `Crawler ${this.config.name} was auto-stopped ${Math.round(
                    autoStopStatus.hoursSinceStop,
                )} hours ago. Will not restart until 20 hours have passed.`,
            );
            return;
        }

        this.logger.log(`Resuming crawler ${this.config.name}`);
        this.isCrawling = true;
        this.status.isRunning = true;
        if (!this.status.startTime) {
            this.status.startTime = new Date();
        }

        await this.crawl();
    }

    /**
     * Crawl for new movies
     * This method now contains the main crawling logic that used to be in the crawl method
     */
    protected async crawlMovies(): Promise<void> {
        this.continuousSkips = 0;

        const today = new Date().toISOString().slice(0, 10);
        const crawlKey = `crawled-pages:${this.config.host.replace('https://', '')}:${today}`;

        const latestMovies = await this.enqueueRequest(() => this.getNewestMovies(1));
        const totalPages = this.getTotalPages(latestMovies);
        this.status.totalPages = totalPages;

        let lastCrawledPage = 0;
        try {
            lastCrawledPage = parseInt(await this.redisService.get(crawlKey)) || 0;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error getting last crawled page from Redis: ${errorMessage}`);
        }

        for (let i = lastCrawledPage; i <= totalPages; i++) {
            this.status.currentPage = i;
            await this.crawlPage(i);
            await this.redisService.set(crawlKey, i, 60 * 60 * 24 * 1000);

            if (this.continuousSkips >= this.config.maxContinuousSkips) {
                this.logger.warn(
                    `Stopping crawler: ${this.continuousSkips} movies skipped continuously without updates`,
                );

                // Mark as auto-stopped but don't touch the schedule (BullMQ handles scheduling)
                await this.markAutoStopped();
                break;
            }

            if (
                this.moviesToRevalidate.length > 0 &&
                this.moviesToRevalidate.length >= this.REVALIDATION_BATCH_SIZE
            ) {
                await this.revalidateMovies();
            }
        }

        // Retry failed movies and pages
        await this.retryFailedCrawls();
        await this.retryFailedPages();
    }

    protected abstract getNewestMovies(page: number): Promise<any>;
    protected abstract fetchAndSaveMovieDetail(slug: string, retryCount?: number): Promise<boolean>;
    /**
     * Save movie details to the database
     * @param movieDetail The movie details to save
     * @returns boolean - true if the movie was updated/created, false if skipped
     */
    protected abstract saveMovieDetail(movieDetail: any): Promise<boolean>;
    protected abstract getTotalPages(response: any): number;
    protected abstract getMovieItems(response: any): any[];

    protected async processImages(
        data: {
            thumbUrl?: string;
            posterUrl?: string;
            host?: string;
            tmdb?: TmdbType;
        },
        options?: { preferTmdb?: boolean },
    ): Promise<{ thumbUrl: string; posterUrl: string }> {
        const preferTmdb = options?.preferTmdb || false;

        // If both thumbUrl and posterUrl are provided and we prefer manual images, return them immediately
        if (!preferTmdb && data?.thumbUrl && data?.posterUrl) {
            return {
                thumbUrl: resolveUrl(data?.thumbUrl, data.host),
                posterUrl: resolveUrl(data?.posterUrl, data.host),
            };
        }

        // Get TMDB images (either as primary source or fallback)
        const tmdbImages = await this.tmdbService.getImages({
            id: data?.tmdb?.id,
            type: data?.tmdb?.type,
        });

        // Process thumbnail image
        let thumb =
            !isNullOrUndefined(data?.thumbUrl) && data?.thumbUrl?.trim() !== ''
                ? resolveUrl(data?.thumbUrl, data.host)
                : null;
        let poster =
            !isNullOrUndefined(data?.posterUrl) && data?.posterUrl?.trim() !== ''
                ? resolveUrl(data?.posterUrl, data.host)
                : null;

        const tmdbBackdrops = (tmdbImages.backdrops || []).filter((b) => b?.file_path);
        const tmdbThumb =
            tmdbBackdrops?.length > 0
                ? resolveUrl(tmdbBackdrops[0].file_path, this.tmdbService.config.imgHost)
                : null;

        const tmdbPosters = (tmdbImages.posters || []).filter((p) => p?.file_path);
        const tmdbPoster =
            tmdbPosters?.length > 0
                ? resolveUrl(tmdbPosters[0].file_path, this.tmdbService.config.imgHost)
                : null;

        // If preferring TMDB, use TMDB images first, then fall back to manual
        if (preferTmdb) {
            thumb = tmdbThumb || thumb;
            poster = tmdbPoster || poster;
        } else {
            // Original behavior: use manual images first, then fall back to TMDB
            thumb = thumb || tmdbThumb;
            poster = poster || tmdbPoster;
        }

        return {
            thumbUrl: thumb,
            posterUrl: poster,
        };
    }

    protected async crawlPage(page: number) {
        try {
            const movies = await this.enqueueRequest(() => this.getNewestMovies(page));
            const items = this.getMovieItems(movies).map((m) => ({
                ...m,
                slug: slugifyVietnamese(m.slug),
            }));

            await Promise.all(
                items.map(async (movie) => {
                    if (movie?.slug) {
                        try {
                            const wasUpdated = await this.fetchAndSaveMovieDetail(movie.slug);
                            if (wasUpdated) {
                                this.status.processedItems++;
                                // Reset continuous skips when a movie is updated
                                this.resetSkipCount();
                            } else {
                                // Only increment skip count if movie was not updated
                                this.incrementSkipCount();
                            }
                        } catch (error) {
                            this.status.failedItems++;
                            this.logger.error(`Error processing movie ${movie.slug}: ${error}`);
                            await this.addToFailedCrawls(movie.slug, error.message);
                            // Continue with next movie instead of throwing
                        }
                    } else {
                        // Invalid movie (no slug), count as skip
                        this.incrementSkipCount();
                    }
                }),
            );
        } catch (error) {
            this.logger.error(`Error crawling page ${page}: ${error}`);
            await this.addToFailedPages(page, error.message);
            // Don't retry immediately, let the retry mechanism handle it
        }
    }

    protected calculateBackoff(retryCount: number): number {
        const baseDelay = 1000;
        const maxDelay = 60000;
        const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
        const jitter = Math.random() * 1000;
        return exponentialDelay + jitter;
    }

    protected async addToFailedCrawls(slug: string, error: string) {
        try {
            const hostStr = this.config.host.replace(/https?:\/\//, '');
            const key = `failed-movie-crawls:${hostStr}`;

            // Use Redis service to store the failure data
            const failureData = {
                error,
                retryCount: 0,
                lastAttempt: new Date().toISOString(),
            };

            // Get current failed crawls
            const currentFailedCrawls =
                (await this.redisService.get<Record<string, any>>(key)) || {};

            // Update with the new failed crawl
            currentFailedCrawls[slug] = failureData;

            // Save the updated record
            await this.redisService.set(key, currentFailedCrawls, 60 * 60 * 24); // 24 hours expiry
        } catch (error) {
            this.logger.error(`Error adding slug ${slug} to failed crawls: ${error.message}`);
        }
    }

    protected async addToFailedPages(page: number, error: string) {
        try {
            const hostStr = this.config.host.replace(/https?:\/\//, '');
            const key = `failed-page-crawls:${hostStr}`;

            // Use Redis service to store the failure data
            const failureData = {
                error,
                retryCount: 0,
                lastAttempt: new Date().toISOString(),
            };

            // Get current failed pages
            const currentFailedPages =
                (await this.redisService.get<Record<string, any>>(key)) || {};

            // Update with the new failed page
            currentFailedPages[page.toString()] = failureData;

            // Save the updated record
            await this.redisService.set(key, currentFailedPages, 60 * 60 * 24); // 24 hours expiry
        } catch (error) {
            this.logger.error(`Error adding page ${page} to failed pages: ${error.message}`);
        }
    }

    protected async retryFailedCrawls() {
        try {
            const hostStr = this.config.host.replace(/https?:\/\//, '');
            const key = `failed-movie-crawls:${hostStr}`;

            // Get failed crawls from Redis
            const failedCrawls = await this.redisService.get<Record<string, any>>(key);

            if (!failedCrawls || Object.keys(failedCrawls).length === 0) {
                this.logger.log('No failed crawls to retry');
                return;
            }

            this.logger.log(`Retrying ${Object.keys(failedCrawls).length} failed crawls`);

            // Track successful retries to remove from the failed list
            const successfulRetries: string[] = [];

            // Process each failed crawl
            for (const [slug, data] of Object.entries(failedCrawls)) {
                try {
                    // Parse the retry data
                    const retryData = typeof data === 'string' ? JSON.parse(data) : data;
                    const retryCount = retryData.retryCount || 0;

                    // Skip if too many retries
                    if (retryCount >= (this.config.maxRetries || 3)) {
                        this.logger.warn(
                            `Skipping retry for ${slug} after ${retryCount} failed attempts`,
                        );
                        continue;
                    }

                    // Attempt to fetch and save again
                    const wasSuccessful = await this.fetchAndSaveMovieDetail(slug);

                    if (wasSuccessful) {
                        // If successful, mark for removal
                        successfulRetries.push(slug);
                        this.logger.log(`Successfully retried crawl for ${slug}`);
                    } else {
                        // Update retry count
                        failedCrawls[slug] = {
                            ...retryData,
                            retryCount: retryCount + 1,
                            lastAttempt: new Date().toISOString(),
                        };

                        this.logger.warn(
                            `Retry ${retryCount + 1} for ${slug} did not result in an update`,
                        );
                    }
                } catch (error) {
                    // Update retry count on error
                    failedCrawls[slug] = {
                        ...(typeof data === 'string' ? JSON.parse(data) : data),
                        error: error.message,
                        retryCount: (data.retryCount || 0) + 1,
                        lastAttempt: new Date().toISOString(),
                    };

                    this.logger.error(`Error retrying crawl for ${slug}: ${error.message}`);
                }

                // Add delay between retries to avoid overwhelming the source
                await sleep(this.config.rateLimitDelay || 1000);
            }

            // Remove successful retries
            for (const slug of successfulRetries) {
                delete failedCrawls[slug];
            }

            // Update the Redis record if there are still failed crawls
            if (Object.keys(failedCrawls).length > 0) {
                await this.redisService.set(key, failedCrawls, 60 * 60 * 24); // 24 hours
            } else {
                // All crawls were successful, remove the key
                await this.redisService.del(key);
            }

            this.logger.log(
                `Retry complete. Successfully retried ${successfulRetries.length} crawls, ${
                    Object.keys(failedCrawls).length
                } remaining`,
            );
        } catch (error) {
            this.logger.error(`Error retrying failed crawls: ${error.message}`);
        }
    }

    protected async retryFailedPages() {
        try {
            const hostStr = this.config.host.replace(/https?:\/\//, '');
            const key = `failed-page-crawls:${hostStr}`;

            // Get failed pages from Redis
            const failedPages = await this.redisService.get<Record<string, any>>(key);

            if (!failedPages || Object.keys(failedPages).length === 0) {
                this.logger.log('No failed pages to retry');
                return;
            }

            this.logger.log(`Retrying ${Object.keys(failedPages).length} failed pages`);

            // Track successful retries to remove from the failed list
            const successfulRetries: string[] = [];

            // Process each failed page
            for (const [pageStr, data] of Object.entries(failedPages)) {
                try {
                    const page = parseInt(pageStr, 10);

                    // Parse the retry data
                    const retryData = typeof data === 'string' ? JSON.parse(data) : data;
                    const retryCount = retryData.retryCount || 0;

                    // Skip if too many retries
                    if (retryCount >= (this.config.maxRetries || 3)) {
                        this.logger.warn(
                            `Skipping retry for page ${page} after ${retryCount} failed attempts`,
                        );
                        continue;
                    }

                    // Attempt to crawl the page again
                    await this.crawlPage(page);

                    // If no exception was thrown, consider it successful
                    successfulRetries.push(pageStr);
                    this.logger.log(`Successfully retried page ${page}`);
                } catch (error) {
                    // Update retry count on error
                    failedPages[pageStr] = {
                        ...(typeof data === 'string' ? JSON.parse(data) : data),
                        error: error.message,
                        retryCount: (data.retryCount || 0) + 1,
                        lastAttempt: new Date().toISOString(),
                    };

                    this.logger.error(`Error retrying page ${pageStr}: ${error.message}`);
                }

                // Add delay between retries to avoid overwhelming the source
                await sleep(this.config.rateLimitDelay || 1000);
            }

            // Remove successful retries
            for (const pageStr of successfulRetries) {
                delete failedPages[pageStr];
            }

            // Update the Redis record if there are still failed pages
            if (Object.keys(failedPages).length > 0) {
                await this.redisService.set(key, failedPages, 60 * 60 * 24); // 24 hours
            } else {
                // All pages were successful, remove the key
                await this.redisService.del(key);
            }

            this.logger.log(
                `Retry complete. Successfully retried ${successfulRetries.length} pages, ${
                    Object.keys(failedPages).length
                } remaining`,
            );
        } catch (error) {
            this.logger.error(`Error retrying failed pages: ${error.message}`);
        }
    }

    protected async revalidateMovies() {
        try {
            const res = await this.httpService.axiosRef.post(
                this.configService.getOrThrow<string>('REVALIDATE_WEBHOOK_URL'),
                { movieSlug: this.moviesToRevalidate },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.configService.getOrThrow<string>('REVALIDATE_API_KEY'),
                    },
                },
            );

            if (res?.status !== 200) {
                this.logger.error(`Failed to revalidate on front-end side: ${res.statusText}`);
                return;
            }

            this.logger.log(
                `Revalidated on front-end side: ${this.moviesToRevalidate.length} movies - ${res.statusText}`,
            );
            this.moviesToRevalidate = [];
        } catch (error) {
            this.logger.error(`Error during revalidateMovies: ${error}`);
        }
    }

    protected processEpisodes(newEpisodes: any[], existingEpisodes: Episode[] = []): Episode[] {
        const processedEpisodes: Episode[] = [...existingEpisodes];
        const existingServers = new Map(
            existingEpisodes?.map((ep) => [`${ep.serverName}-${ep.originSrc}`, ep]),
        );

        (newEpisodes || []).forEach((episode) => {
            if (!episode || !episode.server_name) return;

            const serverName = episode.server_name;
            const originSrc = this.config.name.toLowerCase();

            const serverData = (episode.server_data || episode.items || [])
                .filter(
                    (item: any) =>
                        item && (item.link_embed || item.embed || item.link_m3u8 || item.m3u8),
                )
                ?.map((item: any, index): EpisodeServerData => {
                    const { name, slug } = mappingNameSlugEpisode(item, index);
                    return {
                        name: name,
                        slug: slug,
                        filename: item.name || item.filename || '',
                        linkEmbed: item.link_embed || item.embed || '',
                        linkM3u8: item.link_m3u8 || item.m3u8 || '',
                    };
                });

            if (serverData.length === 0) return;

            const serverKey = `${serverName}-${originSrc}`;

            if (existingServers.has(serverKey)) {
                const existingEpisode = existingServers.get(serverKey);
                existingEpisode.serverData = [
                    ...existingEpisode.serverData,
                    ...serverData.filter(
                        (newData) =>
                            !existingEpisode.serverData.some(
                                (existingData) => existingData.slug === newData.slug,
                            ),
                    ),
                ];
            } else {
                processedEpisodes.push({
                    originSrc: originSrc,
                    serverName: serverName,
                    serverData,
                });
            }
        });

        return processedEpisodes;
    }

    /**
     * Call this method when a movie is skipped due to no updates needed
     */
    protected incrementSkipCount(): void {
        this.continuousSkips++;
        this.logger.debug(`Increment skip count to ${this.continuousSkips}`);

        // If we've hit the skip limit, auto-stop the crawler
        if (this.continuousSkips >= this.config.maxContinuousSkips) {
            this.logger.warn(
                `Crawler has skipped ${this.continuousSkips} items in a row, stopping crawler`,
            );

            // Store the auto-stop time in Redis
            this.markAutoStopped();

            this.stopCrawler();
        }
    }

    /**
     * Call this method when a movie is successfully updated
     */
    protected resetSkipCount(): void {
        if (this.continuousSkips > 0) {
            this.logger.debug(`Reset continuous skips counter from ${this.continuousSkips} to 0`);
        }
        this.continuousSkips = 0;
    }

    /**
     * Compares two quality values and returns true if newQuality is better than currentQuality
     */
    protected isQualityBetter(newQuality: string, currentQuality: string): boolean {
        const qualityRank = {
            '4k': 5,
            fhd: 4,
            fullhd: 4,
            hd: 3,
            sd: 2,
            cam: 1,
        };

        const newRank = qualityRank[newQuality?.toLowerCase()] || 0;
        const currentRank = qualityRank[currentQuality?.toLowerCase()] || 0;

        return newRank > currentRank;
    }

    /**
     * Gets the best quality between existing and new quality
     */
    protected getBestQuality(existingQuality: string, newQuality: string): string {
        if (!existingQuality) return newQuality;
        if (!newQuality) return existingQuality;

        return this.isQualityBetter(newQuality, existingQuality) ? newQuality : existingQuality;
    }

    protected async processExternalData(movieDetail: OPhimMovie): Promise<{
        tmdb?: TmdbType;
        imdb?: ImdbType;
    }> {
        try {
            // Find movie by IMDB ID
            if (movieDetail?.imdb?.id) {
                const tmdbData = await this.tmdbService.findTmdbByImdbId(movieDetail.imdb.id);
                return {
                    tmdb: tmdbData || null,
                    imdb: movieDetail.imdb,
                };
            }

            // Find movie by TMDB ID
            if (movieDetail?.tmdb?.id) {
                const ids = await this.tmdbService.getExternalIds({
                    id: movieDetail?.tmdb?.id?.toString(),
                    type: movieDetail.tmdb.type,
                });

                // Check if we got valid results
                if (!ids) {
                    return { tmdb: null, imdb: null };
                }

                return {
                    tmdb: {
                        ...movieDetail.tmdb,
                        id: ids?.id?.toString(),
                        type: movieDetail.tmdb.type,
                        voteAverage: movieDetail?.tmdb?.vote_average,
                        voteCount: movieDetail?.tmdb?.vote_count,
                    },
                    imdb: ids?.imdb_id ? { id: ids.imdb_id } : null,
                };
            }
        } catch (error) {
            this.logger.error(`Error processing external data: ${error.message}`);
        }

        return { tmdb: null, imdb: null };
    }

    protected async processActors(
        actors?: string[],
        externalData?: { tmdbData?: TmdbType; imdbData?: ImdbType },
    ): Promise<Types.ObjectId[]> {
        // Handle TMDB data processing
        if (externalData?.tmdbData?.id) {
            try {
                const creditData = await this.tmdbService.getCreditDetails(externalData.tmdbData);

                if (creditData && creditData.cast?.length > 0) {
                    // First, try to find actors by TMDB ID
                    const tmdbSearchCriteria = creditData.cast
                        .filter((cast) => cast?.id && cast?.name) // Ensure cast has valid id and name
                        .map((cast) => ({
                            tmdbPersonId: cast.id,
                        }));

                    if (tmdbSearchCriteria.length === 0) {
                        return [];
                    }

                    const existingTmdbActors = await this.actorRepo.find({
                        filterQuery: { $or: tmdbSearchCriteria },
                    });

                    // Create a map for quick lookup
                    const existingActorsMap = new Map(
                        existingTmdbActors.map((actor) => [actor.tmdbPersonId, actor._id]),
                    );

                    // Get actors not found by TMDB ID
                    const remainingCast = creditData.cast
                        .filter((cast) => cast?.id && cast?.name) // Ensure cast has valid id and name
                        .filter((cast) => !existingActorsMap.has(cast.id));

                    // Try to find remaining actors by simple slug (without cast.id)
                    const simpleSlugSearchCriteria = remainingCast
                        .filter((cast) => cast?.name) // Ensure cast has valid name
                        .map((cast) => {
                            // Generate slug with fallback for non-Latin characters
                            let slug = slugifyVietnamese(cast.name, { lower: true });

                            // If slug is empty or null, create a fallback using transliteration or ID
                            if (!slug || slug.trim() === '') {
                                // Try to remove diacritics first as a fallback
                                slug = slugify(removeDiacritics(cast.name), { lower: true });

                                // If still empty, use a combination of 'actor' and TMDB ID
                                if (!slug || slug.trim() === '') {
                                    slug = `t-${cast.id}`;
                                }
                            }

                            return {
                                slug,
                            };
                        });

                    if (simpleSlugSearchCriteria.length > 0) {
                        const existingSlugActors = await this.actorRepo.find({
                            filterQuery: { $or: simpleSlugSearchCriteria },
                        });

                        // Create a map of existing slugs
                        const existingSlugsMap = new Map(
                            existingSlugActors.map((actor) => [actor.slug, actor]),
                        );

                        // Process remaining actors
                        for (const cast of remainingCast) {
                            if (!cast?.name) continue; // Skip if name is missing

                            // Generate slug with fallback for non-Latin characters
                            let simpleSlug = slugifyVietnamese(cast.name, { lower: true });

                            // If slug is empty or null, create a fallback using transliteration or ID
                            if (!simpleSlug || simpleSlug.trim() === '') {
                                // Try to remove diacritics first as a fallback
                                simpleSlug = slugify(removeDiacritics(cast.name), { lower: true });

                                // If still empty, use a combination of 'actor' and TMDB ID
                                if (!simpleSlug || simpleSlug.trim() === '') {
                                    simpleSlug = `t-${cast.id}`;
                                }
                            }

                            if (!simpleSlug) continue; // Skip if all slug generation attempts failed

                            const existingActor = existingSlugsMap.get(simpleSlug);

                            if (existingActor) {
                                // If actor exists with simple slug but different TMDB ID,
                                // create new actor with TMDB ID in slug
                                if (
                                    existingActor.tmdbPersonId &&
                                    existingActor.tmdbPersonId !== cast.id
                                ) {
                                    const formattedSlugWithCastId = `${simpleSlug}-t-${cast.id}`;
                                    const imgUrl = cast.profile_path
                                        ? resolveUrl(
                                              cast.profile_path,
                                              this.tmdbService.config.imgHost,
                                          )
                                        : null;

                                    const newActor = await this.actorRepo.create({
                                        document: {
                                            name: cast.name,
                                            originalName: cast.original_name || cast.name,
                                            slug: formattedSlugWithCastId,
                                            tmdbPersonId: cast.id,
                                            thumbUrl: imgUrl,
                                            posterUrl: imgUrl,
                                        },
                                    });
                                    existingActorsMap.set(cast.id, newActor._id);
                                } else {
                                    // Update existing actor with TMDB data if it doesn't have it
                                    if (!existingActor.tmdbPersonId) {
                                        const imgUrl = cast.profile_path
                                            ? resolveUrl(
                                                  cast.profile_path,
                                                  this.tmdbService.config.imgHost,
                                              )
                                            : null;

                                        await this.actorRepo.updateOne({
                                            filterQuery: { _id: existingActor._id },
                                            updateQuery: {
                                                $set: {
                                                    tmdbPersonId: cast.id,
                                                    thumbUrl: imgUrl,
                                                    posterUrl: imgUrl,
                                                },
                                            },
                                        });
                                    }
                                    existingActorsMap.set(cast.id, existingActor._id);
                                }
                            } else {
                                // Create new actor with simple slug
                                const imgUrl = cast.profile_path
                                    ? resolveUrl(cast.profile_path, this.tmdbService.config.imgHost)
                                    : null;

                                const newActor = await this.actorRepo.create({
                                    document: {
                                        name: cast.name,
                                        originalName: cast.original_name || cast.name,
                                        slug: simpleSlug,
                                        tmdbPersonId: cast.id,
                                        thumbUrl: imgUrl,
                                        posterUrl: imgUrl,
                                    },
                                });
                                existingActorsMap.set(cast.id, newActor._id);
                            }
                        }
                    }

                    // Return all actor IDs
                    return creditData.cast
                        .filter((cast) => cast?.id) // Ensure cast has valid id
                        .map((cast) => existingActorsMap.get(cast.id))
                        .filter((id) => id !== undefined && id !== null);
                }
            } catch (error) {
                this.logger.error(`Error processing TMDB actors: ${error.message}`);
                // Fall back to processing actors from the manual list
            }
        }

        // Handle manual actors list
        if (actors?.length) {
            // Filter out empty strings and invalid values
            const validActors = actors.filter(
                (actor) => actor && typeof actor === 'string' && actor.trim() !== '',
            );

            if (validActors.length === 0) {
                return [];
            }

            // Generate slugs for all actors with proper fallbacks
            const slugs = validActors.map((actor) => {
                let slug = slugifyVietnamese(actor, { lower: true });

                // If slug is empty or null, create a fallback using transliteration
                if (!slug || slug.trim() === '') {
                    // Try to remove diacritics first as a fallback
                    slug = slugify(removeDiacritics(actor), { lower: true });

                    // If still empty, use a generated ID
                    if (!slug || slug.trim() === '') {
                        slug = `actor-${new Types.ObjectId().toString()}`;
                    }
                }

                return slug;
            });

            // Bulk find existing actors
            const existingActors = await this.actorRepo.find({
                filterQuery: { slug: { $in: slugs } },
            });

            // Create a map for quick lookup
            const existingActorsMap = new Map(
                existingActors.map((actor) => [actor.slug, actor._id]),
            );

            // Prepare actors to create
            const actorsToCreate = validActors
                .map((actor, index) => {
                    const slug = slugs[index];
                    if (existingActorsMap.has(slug)) {
                        return null; // Skip if already exists
                    }
                    return {
                        name: actor,
                        originalName: actor,
                        slug,
                    };
                })
                .filter((actor) => actor !== null);

            // Bulk create new actors
            if (actorsToCreate.length > 0) {
                const newActors = await this.actorRepo.insertMany(actorsToCreate);

                // Add new actors to the map
                newActors.forEach((actor) => {
                    existingActorsMap.set(actor.slug, actor._id);
                });
            }

            // Map all actors to their IDs
            return slugs
                .map((slug) => existingActorsMap.get(slug))
                .filter((id) => id !== undefined && id !== null);
        }

        return [];
    }

    protected async processDirectors(
        directors?: string[],
        externalData?: { tmdbData?: TmdbType; imdbData?: ImdbType },
    ): Promise<Types.ObjectId[]> {
        const finalDirectorResult: Types.ObjectId[] = [];

        // Handle TMDB data processing
        if (externalData?.tmdbData?.id) {
            try {
                const creditData = await this.tmdbService.getCreditDetails(externalData.tmdbData);

                if (creditData && creditData.crew?.length > 0) {
                    // Find all directors (case insensitive job match)
                    const directors = creditData.crew
                        .filter((crew) => crew?.job && crew?.name) // Ensure crew has valid job and name
                        .filter((crew) => crew.job.toLowerCase() === 'director');

                    // Process each director
                    for (const director of directors) {
                        if (!director?.name) continue; // Skip if name is missing

                        // Try to find by TMDB ID first
                        let existingDirector = await this.directorRepo.findOne({
                            filterQuery: { tmdbPersonId: director.id },
                        });

                        if (!existingDirector) {
                            // Generate slug with fallback for non-Latin characters
                            let simpleSlug = slugifyVietnamese(director.name, { lower: true });

                            // If slug is empty or null, create a fallback using transliteration or ID
                            if (!simpleSlug || simpleSlug.trim() === '') {
                                // Try to remove diacritics first as a fallback
                                simpleSlug = slugify(removeDiacritics(director.name), {
                                    lower: true,
                                });

                                // If still empty, use a combination of 'director' and TMDB ID
                                if (!simpleSlug || simpleSlug.trim() === '') {
                                    simpleSlug = `t-${director.id}`;
                                }
                            }

                            if (!simpleSlug) continue; // Skip if all slug generation attempts failed

                            // Try to find by simple slug
                            existingDirector = await this.directorRepo.findOne({
                                filterQuery: { slug: simpleSlug },
                            });

                            if (existingDirector) {
                                if (
                                    existingDirector.tmdbPersonId &&
                                    existingDirector.tmdbPersonId !== director.id
                                ) {
                                    // If exists with different TMDB ID, create new with ID in slug
                                    const formattedSlugWithDirectorId = `${simpleSlug}-t-${director.id}`;
                                    const imgUrl = director.profile_path
                                        ? resolveUrl(
                                              director.profile_path,
                                              this.tmdbService.config.imgHost,
                                          )
                                        : null;

                                    existingDirector = await this.directorRepo.create({
                                        document: {
                                            name: director.name,
                                            originalName: director.original_name || director.name,
                                            slug: formattedSlugWithDirectorId,
                                            tmdbPersonId: director.id,
                                            thumbUrl: imgUrl,
                                            posterUrl: imgUrl,
                                        },
                                    });
                                } else if (!existingDirector.tmdbPersonId) {
                                    // Update existing with TMDB data
                                    const imgUrl = director.profile_path
                                        ? resolveUrl(
                                              director.profile_path,
                                              this.tmdbService.config.imgHost,
                                          )
                                        : null;

                                    await this.directorRepo.updateOne({
                                        filterQuery: { _id: existingDirector._id },
                                        updateQuery: {
                                            $set: {
                                                tmdbPersonId: director.id,
                                                thumbUrl: imgUrl,
                                                posterUrl: imgUrl,
                                            },
                                        },
                                    });
                                }
                            } else {
                                // Create new director with simple slug
                                const imgUrl = director.profile_path
                                    ? resolveUrl(
                                          director.profile_path,
                                          this.tmdbService.config.imgHost,
                                      )
                                    : null;

                                existingDirector = await this.directorRepo.create({
                                    document: {
                                        name: director.name,
                                        originalName: director.original_name || director.name,
                                        slug: simpleSlug,
                                        tmdbPersonId: director.id,
                                        thumbUrl: imgUrl,
                                        posterUrl: imgUrl,
                                    },
                                });
                            }
                        }

                        if (existingDirector) {
                            finalDirectorResult.push(existingDirector._id);
                        }
                    }
                }
            } catch (error) {
                this.logger.error(`Error processing TMDB directors: ${error.message}`);
                // Fall back to processing directors from the manual list
            }
        }

        // Handle manual directors list
        if (directors?.length && finalDirectorResult.length === 0) {
            // Filter out empty strings and invalid values
            const validDirectors = directors.filter(
                (director) => director && typeof director === 'string' && director.trim() !== '',
            );

            for (const director of validDirectors) {
                // Generate slug with fallback for non-Latin characters
                let slug = slugifyVietnamese(director, { lower: true });

                // If slug is empty or null, create a fallback using transliteration
                if (!slug || slug.trim() === '') {
                    // Try to remove diacritics first as a fallback
                    slug = slugify(removeDiacritics(director), { lower: true });

                    // If still empty, use a generated ID
                    if (!slug || slug.trim() === '') {
                        slug = `director-${new Types.ObjectId().toString()}`;
                    }
                }

                // Try to find existing director
                const existingDirector = await this.directorRepo.findOne({
                    filterQuery: { slug },
                });

                if (existingDirector) {
                    finalDirectorResult.push(existingDirector._id);
                } else {
                    // Create new director
                    const newDirector = await this.directorRepo.create({
                        document: {
                            name: director,
                            originalName: director,
                            slug,
                        },
                    });
                    finalDirectorResult.push(newDirector._id);
                }
            }
        }

        return finalDirectorResult;
    }

    protected async findExistingMovie(movieDetail: {
        tmdb?: TmdbType;
        imdb?: ImdbType;
        slug?: string;
    }): Promise<Movie | null> {
        // Try to find by TMDB ID first
        if (movieDetail?.tmdb?.id && movieDetail?.tmdb?.type) {
            const movieByTmdb = await this.movieRepo.findOne({
                filterQuery: { 'tmdb.id': movieDetail.tmdb.id, 'tmdb.type': movieDetail.tmdb.type },
            });
            if (movieByTmdb) return movieByTmdb;
        }

        // Try to find by IMDB ID
        if (movieDetail?.imdb?.id) {
            const movieByImdb = await this.movieRepo.findOne({
                filterQuery: { 'imdb.id': movieDetail.imdb.id },
            });
            if (movieByImdb) return movieByImdb;
        }

        // Finally try by slug
        const movieSlug = removeTone(removeDiacritics(movieDetail?.slug || ''));
        return this.movieRepo.findOne({
            filterQuery: { slug: movieSlug },
        });
    }

    protected mergeEpisodes(
        existingEpisodes: Episode[] = [],
        newEpisodes: Episode[],
        sourceName: string,
    ): Episode[] {
        const mergedEpisodes = [...existingEpisodes];

        newEpisodes.forEach((newEp) => {
            // Find matching episode by source and server name
            const existingEpIndex = mergedEpisodes.findIndex(
                (ep) => ep.originSrc === sourceName && ep.serverName === newEp.serverName,
            );

            if (existingEpIndex === -1) {
                // If no matching episode exists, add the new one
                mergedEpisodes.push({
                    ...newEp,
                    originSrc: sourceName,
                });
            } else {
                // If matching episode exists, merge server data
                const existingEp = mergedEpisodes[existingEpIndex];
                const uniqueServerData = newEp.serverData.filter(
                    (newData) =>
                        !existingEp.serverData.some(
                            (existingData) => existingData.slug === newData.slug,
                        ),
                );

                mergedEpisodes[existingEpIndex] = {
                    ...existingEp,
                    serverData: [...existingEp.serverData, ...uniqueServerData],
                };
            }
        });

        return mergedEpisodes;
    }

    /**
     * Main crawl method that orchestrates the crawling process
     */
    protected async crawl(): Promise<void> {
        try {
            this.logger.log(`Starting crawler for ${this.config.name}`);
            this.status.startTime = new Date();
            this.status.isRunning = true;
            this.status.processedItems = 0;
            this.status.failedItems = 0;

            await this.crawlMovies();

            // Process any items waiting to be revalidated
            if (this.moviesToRevalidate.length > 0) {
                await this.revalidateMovies();
            }

            // Log completion
            this.status.isRunning = false;
            this.status.endTime = new Date();
            this.isCrawling = false;

            this.logger.log(
                `Crawl completed: processed ${this.status.processedItems} items, failed ${this.status.failedItems} items`,
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error crawling movies: ${errorMessage}`);
            this.status.error = errorMessage;
            this.status.isRunning = false;
            this.status.endTime = new Date();
            this.isCrawling = false;
        }
    }
}
