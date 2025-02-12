/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpService } from '@nestjs/axios';
import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

import { RedisService } from '../../../libs/modules/redis';
import { MovieRepository } from '../movie.repository';
import { ActorRepository } from '../../actors';
import { CategoryRepository } from '../../categories';
import { DirectorRepository } from '../../directors';
import { RegionRepository } from '../../regions/region.repository';
import { Episode, EpisodeServerData } from '../movie.schema';
import { sleep } from '../../../libs/utils/common';
import { mappingNameSlugEpisode } from './mapping-data';

export interface ICrawlerConfig {
    name: string;
    host: string;
    cronSchedule: string;
    forceUpdate: boolean;
    imgHost?: string;
    maxRetries?: number;
    rateLimitDelay?: number;
    maxConcurrentRequests?: number;
}

export interface ICrawlerDependencies {
    config: ICrawlerConfig;
    configService: ConfigService;
    schedulerRegistry: SchedulerRegistry;
    redisService: RedisService;
    httpService: HttpService;
    movieRepo: MovieRepository;
    actorRepo: ActorRepository;
    categoryRepo: CategoryRepository;
    directorRepo: DirectorRepository;
    regionRepo: RegionRepository;
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

    protected readonly config: ICrawlerConfig;
    protected readonly configService: ConfigService;
    protected readonly schedulerRegistry: SchedulerRegistry;
    protected readonly redisService: RedisService;
    protected readonly httpService: HttpService;
    protected readonly movieRepo: MovieRepository;
    protected readonly actorRepo: ActorRepository;
    protected readonly categoryRepo: CategoryRepository;
    protected readonly directorRepo: DirectorRepository;
    protected readonly regionRepo: RegionRepository;

    private crawlerJob: CronJob;
    private isCrawling = false;
    private status: ICrawlerStatus = {
        isRunning: false,
        processedItems: 0,
        failedItems: 0,
    };
    private requestQueue: Promise<void>[] = [];
    private activeRequests = 0;

    constructor(protected readonly dependencies: ICrawlerDependencies) {
        this.validateConfig(dependencies.config);

        this.config = {
            maxRetries: 3,
            rateLimitDelay: 1000,
            maxConcurrentRequests: 3,
            ...dependencies.config,
        };

        this.configService = dependencies.configService;
        this.schedulerRegistry = dependencies.schedulerRegistry;
        this.redisService = dependencies.redisService;
        this.httpService = dependencies.httpService;
        this.movieRepo = dependencies.movieRepo;
        this.actorRepo = dependencies.actorRepo;
        this.categoryRepo = dependencies.categoryRepo;
        this.directorRepo = dependencies.directorRepo;
        this.regionRepo = dependencies.regionRepo;

        this.logger = new Logger(this.config.name);
        this.logger.log({
            host: this.config.host,
            cron: this.config.cronSchedule,
            forceUpdate: this.config.forceUpdate,
            timeZone: process.env.TZ,
            tzOffset: new Date().getTimezoneOffset(),
        });
    }

    private validateConfig(config: ICrawlerConfig) {
        if (!config.name) throw new Error('Crawler name is required');
        if (!config.host) throw new Error('Crawler host is required');
        if (!config.cronSchedule) throw new Error('Crawler cron schedule is required');
        if (typeof config.forceUpdate !== 'boolean')
            throw new Error('forceUpdate must be a boolean');
    }

    private get jobName(): string {
        return `${this.crawlMovies.name}_${this.config.name}`;
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

    onModuleInit() {
        if (!this.isEnabled()) {
            this.logger.warn(`Crawler ${this.config.name} is disabled by configuration`);
            return;
        }

        this.crawlerJob = new CronJob(this.config.cronSchedule, this.crawlMovies.bind(this));
        this.schedulerRegistry.addCronJob(this.jobName, this.crawlerJob);
        this.crawlerJob.start();
    }

    onModuleDestroy() {
        if (this.schedulerRegistry.doesExist('cron', this.jobName)) {
            this.schedulerRegistry.deleteCronJob(this.jobName);
        }
    }

    /**
     * Manually trigger a crawl operation
     * @returns Promise that resolves when crawling is complete
     */
    public async triggerCrawl(): Promise<void> {
        if (!this.isEnabled()) {
            this.logger.warn(
                `Cannot trigger crawl: Crawler ${this.config.name} is disabled by configuration`,
            );
            return;
        }

        if (this.isCrawling) {
            this.logger.warn('Crawler is already running');
            return;
        }
        return this.crawl();
    }

    /**
     * Stop the crawler's cron job
     */
    public stopCrawler(): void {
        if (this.crawlerJob) {
            this.crawlerJob.stop();
            this.logger.log('Crawler stopped');
        }
    }

    /**
     * Resume the crawler's cron job
     */
    public resumeCrawler(): void {
        if (this.crawlerJob && !this.crawlerJob.running) {
            this.crawlerJob.start();
            this.logger.log('Crawler resumed');
        }
    }

    /**
     * Get the crawler's current status
     */
    public getStatus(): ICrawlerStatus {
        return {
            ...this.status,
            isRunning: this.isCrawling,
            lastRun: this.crawlerJob?.lastDate(),
        };
    }

    protected abstract crawlMovies(): Promise<void>;
    protected abstract getNewestMovies(page: number): Promise<any>;
    protected abstract fetchAndSaveMovieDetail(slug: string, retryCount?: number): Promise<void>;
    protected abstract saveMovieDetail(movieDetail: any): Promise<void>;
    protected abstract getTotalPages(response: any): number;
    protected abstract getMovieItems(response: any): any[];

    protected async crawl() {
        if (this.isCrawling) {
            this.logger.warn('Crawler is already running');
            return;
        }

        this.isCrawling = true;
        this.status = {
            isRunning: true,
            processedItems: 0,
            failedItems: 0,
            startTime: new Date(),
        };

        const today = new Date().toISOString().slice(0, 10);
        const crawlKey = `crawled-pages:${this.config.host}:${today}`;

        try {
            const latestMovies = await this.enqueueRequest(() => this.getNewestMovies(1));
            const totalPages = this.getTotalPages(latestMovies);
            this.status.totalPages = totalPages;

            let lastCrawledPage = 0;
            try {
                lastCrawledPage = parseInt(await this.redisService.get(crawlKey)) || 0;
            } catch (error) {
                this.logger.error(`Error getting last crawled page from Redis: ${error}`);
            }

            for (let i = lastCrawledPage; i <= totalPages; i++) {
                this.status.currentPage = i;
                await this.crawlPage(i);
                await this.redisService.set(crawlKey, i, 60 * 60 * 24 * 1000);

                if (
                    this.moviesToRevalidate.length > 0 &&
                    this.moviesToRevalidate.length >= this.REVALIDATION_BATCH_SIZE
                ) {
                    await this.revalidateMovies();
                }
            }

            for (let retryAttempt = 0; retryAttempt < this.config.maxRetries; retryAttempt++) {
                await this.retryFailedCrawls();
            }

            if (this.moviesToRevalidate.length > 0) {
                await this.revalidateMovies();
            }
        } catch (error) {
            this.logger.error(`Error crawling movies: ${error}`);
            this.status.error = error.message;
        } finally {
            this.isCrawling = false;
            this.status.isRunning = false;
            this.status.endTime = new Date();
        }
    }

    protected async crawlPage(page: number) {
        try {
            const movies = await this.enqueueRequest(() => this.getNewestMovies(page));
            const items = this.getMovieItems(movies);

            await Promise.all(
                items.map(async (movie) => {
                    if (movie?.slug) {
                        try {
                            await this.fetchAndSaveMovieDetail(movie.slug);
                            this.status.processedItems++;
                        } catch (error) {
                            this.status.failedItems++;
                            throw error;
                        }
                    }
                }),
            );
        } catch (error) {
            this.logger.error(`Error crawling page ${page}: ${error}`);
            await sleep(this.RETRY_DELAY);
            return this.crawlPage(page);
        }
    }

    protected calculateBackoff(retryCount: number): number {
        const baseDelay = 1000;
        const maxDelay = 60000;
        const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
        const jitter = Math.random() * 1000;
        return exponentialDelay + jitter;
    }

    protected async addToFailedCrawls(slug: string) {
        try {
            await this.redisService.getClient.sadd(`failed-movie-crawls-${this.config.host}`, slug);
            await this.redisService.getClient.expire(
                `failed-movie-crawls-${this.config.host}`,
                60 * 60 * 12,
            );
        } catch (error) {
            this.logger.error(`Error adding slug ${slug} to failed crawls: ${error}`);
        }
    }

    protected async retryFailedCrawls() {
        try {
            const failedSlugs = await this.redisService.getClient.smembers(
                `failed-movie-crawls-${this.config.host}`,
            );
            if (failedSlugs?.length === 0) {
                return;
            }

            for (const slug of failedSlugs) {
                try {
                    await this.fetchAndSaveMovieDetail(slug);
                    await this.redisService.getClient.srem(
                        `failed-movie-crawls-${this.config.host}`,
                        slug,
                    );
                } catch (error) {
                    this.logger.error(`Error retrying crawl for slug ${slug}: ${error}`);
                }
            }
        } catch (error) {
            this.logger.error(`Error during retryFailedCrawls: ${error}`);
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
}
