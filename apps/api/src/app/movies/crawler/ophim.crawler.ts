/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';
import { Ophim, Movie as OPhimMovie, Server as OPhimServerData } from 'ophim-js';
import { OPhimResponseSingle } from 'ophim-js/lib/types/response-wrapper';
import slugify from 'slugify';
import { stripHtml } from 'string-strip-html';

import { EpisodeServerData, Movie } from '../movie.schema';
import { MovieRepository } from '../movie.repository';
import {
    convertToObjectId,
    isNullOrUndefined,
    resolveUrl,
    sleep,
    slugifyVietnamese,
} from '../../../libs/utils/common';
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
import { BaseCrawler, ICrawlerConfig, ICrawlerDependencies } from './base.crawler';
import { TmdbService } from 'apps/api/src/libs/modules/themoviedb.org/tmdb.service';

/**
 * Crawler implementation for OPhim movie source.
 * Handles fetching and updating movies from ophim1.com.
 *
 * Features:
 * - Fetches latest movies from OPhim API
 * - Updates movie details including episodes and servers
 * - Handles pagination and rate limiting
 * - Supports force update mode
 *
 * Configuration (via environment variables):
 * - OPHIM_HOST: Base URL for OPhim API (default: https://ophim1.com)
 * - OPHIM_CRON: Cron schedule for updates (default: 0 4 * * *)
 * - OPHIM_FORCE_UPDATE: Whether to force update existing movies (default: false)
 * - OPHIM_MAX_RETRIES: Maximum number of retry attempts (default: 3)
 */
@Injectable()
export class OphimCrawler extends BaseCrawler {
    private readonly ophim: Ophim;

    /**
     * Constructor for OphimCrawler
     * @param configService ConfigService instance
     * @param schedulerRegistry SchedulerRegistry instance
     * @param redisService RedisService instance
     * @param httpService HttpService instance
     * @param movieRepo MovieRepository instance
     * @param actorRepo ActorRepository instance
     * @param categoryRepo CategoryRepository instance
     * @param directorRepo DirectorRepository instance
     * @param regionRepo RegionRepository instance
     */
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
        protected tmdbService: TmdbService,
    ) {
        const config: ICrawlerConfig = {
            name: 'OphimCrawler',
            host: configService.getOrThrow<string>('OPHIM_HOST', 'https://ophim1.com'),
            imgHost: configService.getOrThrow<string>(
                'OPHIM_IMG_HOST',
                'https://img.ophim.live/uploads/movies',
            ),
            cronSchedule: configService.getOrThrow<string>('OPHIM_CRON', '0 4 * * *'),
            forceUpdate: configService.getOrThrow<string>('OPHIM_FORCE_UPDATE', 'false') === 'true',
            maxRetries: configService.getOrThrow<number>('OPHIM_MAX_RETRIES', 3),
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
            tmdbService,
        };

        super(dependencies);

        this.ophim = new Ophim({
            host: config.host,
        });
    }

    /**
     * Override of base method to check if this crawler should be enabled
     * @returns true if the crawler should be enabled
     */
    protected shouldEnable(): boolean {
        // Only enable if OPHIM_HOST is set and not 'false'
        const ophimHost = this.configService.get<string>('OPHIM_HOST');
        return !!ophimHost && ophimHost !== 'false';
    }

    /**
     * Main crawl method called by the cron job
     */
    protected async crawlMovies(): Promise<void> {
        this.logger.log('Crawling movie from Ophim ...');
        await this.crawl();
    }

    /**
     * Fetches the newest movies from a specific page
     * @param page Page number to fetch
     * @returns Promise with the movie list response
     */
    protected async getNewestMovies(page: number): Promise<any> {
        return this.ophim.getNewestMovies({ page });
    }

    /**
     * Gets the total number of pages from a response
     * @param response Response from getNewestMovies
     * @returns Total number of pages
     */
    protected getTotalPages(response: any): number {
        return response.pagination.totalPages;
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
            const movieDetail = await this.ophim.getMovieDetail({ slug });
            if (!movieDetail) {
                return false;
            }

            // saveMovieDetail returns true if movie was updated, false if skipped
            const wasUpdated = await this.saveMovieDetail(movieDetail);
            if (!wasUpdated) {
                this.logger.log(`Movie ${slug} was skipped (no updates needed)`);
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
     * @param input Movie details from OPhim API
     * @returns Promise<boolean> - true if movie was updated, false if skipped
     */
    protected async saveMovieDetail(
        input: OPhimResponseSingle<
            OPhimMovie & {
                episodes?: OPhimServerData[];
            }
        >,
    ): Promise<boolean> {
        const { data: { item: movieDetail } = {} } = input;

        try {
            const existingMovie = await this.findExistingMovie(movieDetail);
            const lastModified = new Date(movieDetail?.modified?.time || 0).getTime();

            if (!this.config.forceUpdate && existingMovie) {
                // Check if this source's data is already up to date
                if (lastModified <= (existingMovie?.lastSyncModified?.ophim || 0)) {
                    return false;
                }
            }

            const [{ categories: categoryIds, countries: countryIds }, actorIds, directorIds] =
                await Promise.all([
                    this.processCategoriesAndCountries(movieDetail),
                    this.processActors(movieDetail?.actor, { tmdbData: movieDetail?.tmdb }),
                    this.processDirectors(movieDetail?.director, { tmdbData: movieDetail?.tmdb }),
                ]);

            const {
                _id,
                is_copyright,
                poster_url,
                thumb_url,
                trailer_url,
                origin_name,
                episode_current,
                episode_total,
                sub_docquyen,
                chieurap,
                content,
                year,
                view,
                modified,
            } = movieDetail;

            let correctId: Types.ObjectId;
            try {
                correctId = convertToObjectId(_id);
            } catch (error) {
                correctId = new Types.ObjectId();
            }

            const { tmdb, imdb } = await this.processExternalData(movieDetail);

            // Save movie
            const movieData: Movie = {
                ...(existingMovie || {}),
                ...movieDetail,

                // Mapping data
                type: MOVIE_TYPE_MAP[movieDetail?.type] || 'N/A',
                time: convertToVietnameseTime(movieDetail?.time || existingMovie?.time),
                // Keep the best quality
                quality: this.getBestQuality(
                    existingMovie?.quality,
                    mapQuality(movieDetail?.quality),
                ),
                lang: mapLanguage(movieDetail?.lang || existingMovie?.lang),
                status: mapStatus(movieDetail?.status || existingMovie?.status),
                view: Math.max(view, existingMovie?.view || 0, 0),

                lastSyncModified: {
                    ...existingMovie?.lastSyncModified,
                    ophim: lastModified,
                },

                _id: correctId,
                name: movieDetail?.name,
                slug: movieDetail?.slug || slugify(movieDetail?.name, { lower: true }),
                content: stripHtml(content || '').result || existingMovie?.content || '',
                actors: actorIds,
                categories: categoryIds,
                countries: countryIds,
                directors: directorIds,

                // With ophim, we should reverse thumb and poster, because poster should is vertical image
                thumbUrl: resolveUrl(poster_url, this.config.imgHost),
                posterUrl: resolveUrl(thumb_url, this.config.imgHost),
                // With ophim, we should reverse thumb and poster, because poster should is vertical image

                trailerUrl: trailer_url,
                isCopyright: is_copyright,
                originName: origin_name,
                episodeCurrent: episode_current,
                episodeTotal: episode_total,
                subDocquyen: sub_docquyen,
                cinemaRelease: chieurap,
                year,
                episode: this.mergeEpisodes(
                    existingMovie?.episode,
                    this.processEpisodes(movieDetail?.episodes),
                    'ophim',
                ),
                tmdb,
                imdb,
            };

            if (existingMovie) {
                const updateQuery: Partial<Movie> = {};
                for (const [key, value] of Object.entries(movieData)) {
                    if (!isNullOrUndefined(value)) {
                        updateQuery[key] = value;
                    }
                }

                await this.movieRepo.findOneAndUpdate({
                    filterQuery: { _id: existingMovie._id },
                    updateQuery,
                });
                this.moviesToRevalidate.push(movieData.slug);
                this.logger.log(`Updated movie: "${movieData.slug}"`);
            } else {
                await this.movieRepo.create({
                    document: movieData,
                });
                this.logger.log(`Saved new movie: "${movieData.slug}"`);
            }
            return true;
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieDetail.slug}: ${error}`);
            return false;
        }
    }

    /**
     * Process categories and countries for a movie
     * @param movieDetail Movie details from OPhim API
     * @returns Promise with categories and countries
     */
    protected async processCategoriesAndCountries(
        movieDetail: any,
    ): Promise<{ categories: any[]; countries: any[] }> {
        const categories = await Promise.all(
            movieDetail?.category?.map(async (category) => {
                if (isNullOrUndefined(category) || !category?.name || !category?.slug) {
                    return null;
                }
                const existingCategory = await this.categoryRepo.findOne({
                    filterQuery: { slug: category.slug },
                });
                if (existingCategory) {
                    return existingCategory._id;
                } else {
                    const newCategory = await this.categoryRepo.create({
                        document: {
                            name: category.name,
                            slug: category.slug,
                        },
                    });
                    return newCategory._id;
                }
            }) || [],
        );

        const countries = await Promise.all(
            movieDetail?.country?.map(async (country) => {
                if (isNullOrUndefined(country) || !country?.name || !country?.slug) {
                    return null;
                }
                const existingCountry = await this.regionRepo.findOne({
                    filterQuery: { slug: country.slug },
                });
                if (existingCountry) {
                    return existingCountry._id;
                } else {
                    const newCountry = await this.regionRepo.create({
                        document: {
                            name: country.name,
                            slug: country.slug,
                        },
                    });
                    return newCountry._id;
                }
            }) || [],
        );

        return {
            categories: categories.filter((id) => id !== null),
            countries: countries.filter((id) => id !== null),
        };
    }

    /**
     * Process episodes for a movie
     * @param episodes Episodes from OPhim API
     * @returns Array of episode objects
     */
    protected processEpisodes(episodes: OPhimServerData[]): any[] {
        if (!episodes?.length) return [];

        return episodes.map((server, index) => {
            const serverData: EpisodeServerData[] = server?.server_data?.map((item, index) => {
                const { name, slug } = mappingNameSlugEpisode(item, index);
                return {
                    name: name,
                    slug: slug,
                    linkEmbed: resolveUrl(item?.link_embed),
                    linkM3u8: resolveUrl(item?.link_m3u8),
                    filename: item?.filename,
                };
            });

            return {
                originSrc: 'ophim',
                serverName: server?.server_name || `OP #${index + 1}`,
                serverData,
            };
        });
    }
}
