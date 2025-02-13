/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';
import { stripHtml } from 'string-strip-html';
import { removeDiacritics, removeTone } from '@vn-utils/text';

import { EpisodeServerData, Movie, Episode } from './../movie.schema';
import { MovieRepository } from './../movie.repository';
import { isNullOrUndefined, sleep, slugifyVietnamese } from '../../../libs/utils/common';
import { ActorRepository } from '../../actors';
import { RedisService } from '../../../libs/modules/redis';
import { CategoryRepository } from '../../categories';
import { RegionRepository } from '../../regions/region.repository';
import { DirectorRepository } from '../../directors';
import {
    convertToVietnameseTime,
    mapLanguage,
    mappingNameSlugEpisode,
    mapQuality,
    mapStatus,
    MOVIE_TYPE_MAP,
} from './mapping-data';
import { AbstractRepository } from 'apps/api/src/libs/abstract/abstract.repository';
import { MovieTypeEnum } from '../movie.constant';
import { BaseCrawler, ICrawlerConfig, ICrawlerDependencies } from './base.crawler';

/**
 * Crawler implementation for NguonC movie source.
 * Handles fetching and updating movies from NguonC's API.
 *
 * Features:
 * - Fetches latest movies from NguonC API
 * - Updates movie details including episodes and servers
 * - Handles pagination and rate limiting
 * - Supports force update mode
 * - Handles Vietnamese slug conversion
 * - Supports custom episode naming and slugs
 *
 * Configuration (via environment variables):
 * - NGUONC_HOST: Base URL for NguonC API
 * - NGUONC_CRON: Cron schedule for updates (default: 0 6 * * *)
 * - NGUONC_FORCE_UPDATE: Whether to force update existing movies (default: false)
 * - NGUONC_MAX_RETRIES: Maximum number of retry attempts (default: 3)
 */
@Injectable()
export class NguoncCrawler extends BaseCrawler {
    constructor(
        configService: ConfigService,
        schedulerRegistry: SchedulerRegistry,
        redisService: RedisService,
        httpService: HttpService,
        movieRepo: MovieRepository,
        actorRepo: ActorRepository,
        categoryRepo: CategoryRepository,
        directorRepo: DirectorRepository,
        regionRepo: RegionRepository,
    ) {
        const config: ICrawlerConfig = {
            name: 'NguoncCrawler',
            host: configService.getOrThrow<string>('NGUONC_HOST', 'https://phim.nguonc.com/api'),
            cronSchedule: configService.getOrThrow<string>('NGUONC_CRON', '0 6 * * *'),
            forceUpdate:
                configService.getOrThrow<string>('NGUONC_FORCE_UPDATE', 'false') === 'true',
            maxRetries: configService.getOrThrow<number>('NGUONC_MAX_RETRIES', 3),
        };

        const dependencies: ICrawlerDependencies = {
            config,
            configService,
            schedulerRegistry,
            redisService,
            httpService,
            movieRepo,
            actorRepo,
            categoryRepo,
            directorRepo,
            regionRepo,
        };

        super(dependencies);
    }

    /**
     * Override of base method to check if this crawler should be enabled
     * @returns true if the crawler should be enabled
     */
    protected shouldEnable(): boolean {
        // Only enable if NGUONC_HOST is set and not 'false'
        const nguoncHost = this.configService.get<string>('NGUONC_HOST');
        return !!nguoncHost && nguoncHost !== 'false';
    }

    /**
     * Main crawl method called by the cron job
     */
    protected async crawlMovies(): Promise<void> {
        this.logger.log('Crawling movie from Nguonc ...');
        await this.crawl();
    }

    /**
     * Fetches the newest movies from a specific page
     * @param page Page number to fetch
     * @returns Promise with the movie list response
     */
    protected async getNewestMovies(page: number): Promise<any> {
        const response = await this.httpService.axiosRef.get(
            `${this.config.host}/films/phim-moi-cap-nhat?page=${page}`,
        );
        return response.data;
    }

    /**
     * Gets the total number of pages from a response
     * @param response Response from getNewestMovies
     * @returns Total number of pages
     */
    protected getTotalPages(response: any): number {
        return response.paginate.total_page;
    }

    /**
     * Gets the movie items from a response
     * @param response Response from getNewestMovies
     * @returns Array of movie items
     */
    protected getMovieItems(response: any): any[] {
        return response.items;
    }

    /**
     * Fetches and saves details for a specific movie
     * @param slug Movie slug to fetch
     * @param retryCount Current retry attempt number
     * @returns Promise<boolean> - true if movie was updated, false if skipped
     */
    protected async fetchAndSaveMovieDetail(slug: string, retryCount = 0): Promise<boolean> {
        slug = slugifyVietnamese(slug);

        try {
            const response = await this.httpService.axiosRef.get(
                `${this.config.host}/film/${slug}`,
            );
            const movieDetail = response.data.movie;
            if (!movieDetail) {
                return false;
            }

            // saveMovieDetail returns true if movie was updated, false if skipped
            const wasUpdated = await this.saveMovieDetail(movieDetail);
            if (wasUpdated) {
                this.logger.log(`Successfully saved movie: ${slug}`);
            } else {
                this.logger.debug(`Movie ${slug} was skipped (no updates needed)`);
            }
            return wasUpdated;
        } catch (error) {
            if (retryCount < this.config.maxRetries) {
                this.logger.warn(
                    `Error fetching movie detail for ${slug}, retrying (${retryCount + 1}/${
                        this.config.maxRetries
                    }): ${error.message}`,
                );
                await sleep(this.RETRY_DELAY);
                return this.fetchAndSaveMovieDetail(slug, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Saves or updates movie details in the database
     * @param movieDetail Movie details from NguonC API
     * @returns Promise<boolean> - true if movie was updated, false if skipped
     */
    protected async saveMovieDetail(movieDetail: any): Promise<boolean> {
        const movieSlug = removeTone(removeDiacritics(movieDetail?.slug || ''));

        try {
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieSlug },
            });

            const lastModified = new Date(movieDetail?.modified || 0);
            if (
                existingMovie &&
                !this.config.forceUpdate &&
                lastModified <= existingMovie?.lastSyncModified
            ) {
                return false;
            }

            const [{ categories, countries }, actorIds, directorIds] = await Promise.all([
                this.processCategoriesAndCountries(movieDetail.category),
                this.processActors(movieDetail.casts),
                this.processDirectors(movieDetail.director),
            ]);

            const processedEpisodes = this.processEpisodes(
                movieDetail.episodes,
                existingMovie?.episode || [],
            );

            const movieData: Partial<Movie> = {
                ...(existingMovie || {}),
                type:
                    MOVIE_TYPE_MAP[this.processMovieType(movieDetail) || existingMovie?.type] ||
                    'N/A',
                time: convertToVietnameseTime(movieDetail?.time || existingMovie?.time),
                // Keep the best quality
                quality: this.getBestQuality(
                    existingMovie?.quality,
                    mapQuality(movieDetail?.quality),
                ),
                lang: mapLanguage(movieDetail?.lang || existingMovie?.lang),
                status: mapStatus(existingMovie?.status || this.processMovieStatus(movieDetail)),
                lastSyncModified: new Date(
                    Math.max(
                        movieDetail?.modified ? new Date(movieDetail.modified).getTime() : 0,
                        !isNullOrUndefined(existingMovie?.lastSyncModified)
                            ? new Date(existingMovie.lastSyncModified).getTime()
                            : 0,
                        0,
                    ),
                ),
                _id: existingMovie?._id || new Types.ObjectId(),
                slug:
                    existingMovie?.slug ||
                    slugifyVietnamese(movieDetail.slug?.toString() || '', { lower: true }) ||
                    slugifyVietnamese(movieDetail.name?.toString() || '', { lower: true }),
                content: movieDetail?.content
                    ? stripHtml(movieDetail.content.toString()).result
                    : existingMovie?.content || '',
                actors: actorIds.length > 0 ? actorIds : existingMovie?.actors || [],
                categories: categories.length > 0 ? categories : existingMovie?.categories || [],
                countries: countries.length > 0 ? countries : existingMovie?.countries || [],
                directors:
                    directorIds && directorIds?.length > 0
                        ? directorIds
                        : existingMovie?.directors || [],
                thumbUrl: existingMovie?.thumbUrl || movieDetail.thumb_url || '',
                posterUrl: existingMovie?.posterUrl || movieDetail.poster_url || '',

                name: existingMovie?.name || movieDetail.name || '',
                originName: existingMovie?.originName || movieDetail.origin_name || '',
                episodeTotal:
                    existingMovie?.episodeTotal || movieDetail.episode_total?.toString() || '',
                episodeCurrent: existingMovie?.episodeCurrent || movieDetail.episode_current || '',
                year:
                    existingMovie?.year ||
                    (Object.values(movieDetail.category || {}) as any[]).find(
                        (group: any) => group?.group?.name?.toLowerCase() === 'năm',
                    )?.list?.[0]?.name
                        ? parseInt(
                              (Object.values(movieDetail.category || {}) as any[]).find(
                                  (group: any) => group?.group?.name?.toLowerCase() === 'năm',
                              )?.list?.[0]?.name,
                          )
                        : null,
                episode:
                    processedEpisodes.length > 0 ? processedEpisodes : existingMovie?.episode || [],
            };

            if (existingMovie) {
                const updateQuery: Partial<Movie> = {};
                for (const [key, value] of Object.entries(movieData)) {
                    if (!isNullOrUndefined(value)) {
                        updateQuery[key] = value;
                    }
                }
                await this.movieRepo.findOneAndUpdate({
                    filterQuery: { slug: movieSlug },
                    updateQuery,
                });
                this.moviesToRevalidate.push(movieSlug);
                this.logger.log(`Updated movie: "${movieSlug}"`);
            } else {
                await this.movieRepo.create({ document: movieData as Movie });
                this.logger.log(`Saved new movie: "${movieSlug}"`);
            }
            return true;
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieSlug}: ${error}`);
            return false;
        }
    }

    /**
     * Process movie status from NguonC API
     * @param movieDetail Movie detail object
     * @returns Movie status string
     */
    protected processMovieStatus(movieDetail: any): string | null {
        const currentEpisode: string = movieDetail?.current_episode;
        if (
            currentEpisode?.includes('Hoàn tất') ||
            currentEpisode?.toLowerCase()?.includes('full')
        ) {
            return 'completed';
        }
        if (currentEpisode?.toLowerCase()?.includes('tập')) {
            return 'ongoing';
        }
        if (currentEpisode?.toLowerCase()?.includes('đang cập nhật')) {
            return 'updating';
        }
        return null;
    }

    /**
     * Process movie type from NguonC API
     * @param movieDetail Movie detail object
     * @returns Movie type string
     */
    protected processMovieType(movieDetail: any): MovieTypeEnum {
        const movieTypeCate = (Object.values(movieDetail.category || {}) as any[]).find(
            (group: any) => group?.group?.name?.toLowerCase() === 'định dạng',
        );
        let movieType = movieTypeCate?.list?.[0]?.name
            ? MOVIE_TYPE_MAP[movieTypeCate?.list?.[0]?.name?.toLowerCase()]
            : null;

        if (!movieType) {
            if (
                movieDetail?.total_episodes === 1 ||
                movieDetail?.total_episodes === '1' ||
                movieDetail?.current_episode?.toLowerCase() === 'full'
            ) {
                movieType = MovieTypeEnum.SINGLE;
            } else {
                movieType = MovieTypeEnum.SERIES;
            }
        }

        return movieType;
    }

    /**
     * Process categories and countries from NguonC API
     * @param category Category object
     * @returns Promise with categories and countries arrays
     */
    protected async processCategoriesAndCountries(
        category: any,
    ): Promise<{ categories: any[]; countries: any[] }> {
        let categories = [];
        let countries = [];

        for (const c of Object.values<any>(category || {})) {
            if (c.group?.name?.toLowerCase() === 'quốc gia') {
                countries = await this.processEntities(
                    c?.list?.map((c: { name: string }) => c?.name) || [],
                    this.regionRepo,
                );
            } else if (c.group?.name?.toLowerCase() === 'thể loại') {
                categories = await this.processEntities(
                    c?.list?.map((c: { name: string }) => c?.name) || [],
                    this.categoryRepo,
                );
            }
        }

        return { categories, countries };
    }

    /**
     * Process actors from NguonC API
     * @param casts Comma-separated list of actor names
     * @returns Promise with array of actor ObjectIds
     */
    protected async processActors(casts: string): Promise<any[]> {
        const actorNames = (casts || '')
            .split(',')
            ?.map((name) => name?.toString()?.trim())
            .filter((actor) => !isNullOrUndefined(actor) && !!actor);
        return this.processEntities(actorNames || [], this.actorRepo);
    }

    /**
     * Process directors from NguonC API
     * @param directors Comma-separated list of director names
     * @returns Promise with array of director ObjectIds
     */
    protected async processDirectors(directors: string): Promise<any[]> {
        const directorNames = (directors || '')
            .split(',')
            ?.map((name) => name?.toString()?.trim())
            .filter((director) => !isNullOrUndefined(director) && !!director);
        return this.processEntities(directorNames || [], this.directorRepo);
    }

    /**
     * Process entities (actors, directors, categories, regions) from NguonC API
     * @param names Array of entity names
     * @param repo Repository for the entity type
     * @returns Promise with array of entity ObjectIds
     */
    protected async processEntities(
        names: string[],
        repo: AbstractRepository<any>,
    ): Promise<any[]> {
        if (isNullOrUndefined(names) || !names?.length) {
            return [];
        }
        const entities = await Promise.all(
            names?.map(async (name) => {
                name = name?.toString()?.trim();
                if (isNullOrUndefined(name) || typeof name !== 'string' || name === '') {
                    return null;
                }
                const slug = slugifyVietnamese(name, { lower: true });
                let entity = await repo.findOne({ filterQuery: { slug } });
                if (!entity) {
                    entity = await repo.create({
                        document: { name: name, slug },
                    });
                }
                return entity._id;
            }),
        );
        return entities.filter((val) => !isNullOrUndefined(val) && !!val);
    }

    /**
     * Process episodes from NguonC API
     * @param newEpisodes Array of episode objects
     * @param existingEpisodes Array of existing episode objects
     * @returns Array of processed episode objects
     */
    protected processEpisodes(newEpisodes: any[], existingEpisodes: Episode[] = []): Episode[] {
        const processedEpisodes: Episode[] = [...existingEpisodes];
        const existingServers = new Map(
            existingEpisodes?.map((ep) => [`${ep.serverName}-${ep.originSrc}`, ep]),
        );
        let ncCounter = 1;

        (newEpisodes || []).forEach((episode) => {
            if (!episode || !episode.server_name) return;

            const serverName = episode.server_name || `NC #${ncCounter++}`;
            const originSrc = 'nguonc'; // Assuming 'ophim' is the source for this crawler

            const serverData = (episode.items || [])
                .filter((item: any) => item && (item.embed || item.m3u8))
                ?.map((item: any, index): EpisodeServerData => {
                    const { name, slug } = mappingNameSlugEpisode(item, index);
                    return {
                        name: name,
                        slug: slug,
                        filename: item.name || '',
                        linkEmbed: item.embed || '',
                        linkM3u8: item.m3u8 || '',
                    };
                });

            if (serverData.length === 0) return;

            const serverKey = `${serverName}-${originSrc}`;

            if (existingServers.has(serverKey)) {
                // Update existing server
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
                // Add new server
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
     * Revalidates movies on the frontend
     * @returns Promise<void>
     */
    protected async revalidateMovies(): Promise<void> {
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
            this.moviesToRevalidate = []; // Clear the array after revalidation
        } catch (error) {
            this.logger.error(`Error during revalidateMovies: ${error}`);
        }
    }

    /**
     * Calculates the backoff delay for retries
     * @param retryCount Current retry attempt number
     * @returns Backoff delay in milliseconds
     */
    protected calculateBackoff(retryCount: number): number {
        // Exponential backoff with jitter
        const baseDelay = 1000; // 1 second
        const maxDelay = 60000; // 1 minute
        const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
        const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
        return exponentialDelay + jitter;
    }
}
