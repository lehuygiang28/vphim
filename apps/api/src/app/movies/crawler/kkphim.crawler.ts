/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';
import { Ophim, Movie as OPhimMovie, Server as OPhimServerData } from 'ophim-js';
import slugify from 'slugify';
import { stripHtml } from 'string-strip-html';
import { removeDiacritics, removeTone } from '@vn-utils/text';
import {
    MOVIE_TYPE_MAP,
    convertToVietnameseTime,
    mapLanguage,
    mapQuality,
    mapStatus,
    mappingNameSlugEpisode,
} from './mapping-data';

import { EpisodeServerData, Movie } from './../movie.schema';
import { MovieRepository } from './../movie.repository';
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
import { BaseCrawler, ICrawlerConfig, ICrawlerDependencies } from './base.crawler';
import { TmdbService } from 'apps/api/src/libs/modules/themoviedb.org/tmdb.service';

@Injectable()
export class KKPhimCrawler extends BaseCrawler {
    private readonly kkphim: Ophim;

    constructor(
        configService: ConfigService,
        schedulerRegistry: SchedulerRegistry,
        redisService: RedisService,
        movieRepo: MovieRepository,
        actorRepo: ActorRepository,
        categoryRepo: CategoryRepository,
        directorRepo: DirectorRepository,
        regionRepo: RegionRepository,
        httpService: HttpService,
        protected tmdbService: TmdbService,
    ) {
        const config: ICrawlerConfig = {
            name: 'KKPhimCrawler',
            host: configService.getOrThrow<string>('KKPHIM_HOST', 'https://phimapi.com'),
            imgHost: configService.getOrThrow<string>('KKPHIM_IMG_HOST', 'https://phimimg.com'),
            cronSchedule: configService.getOrThrow<string>('KKPHIM_CRON', '0 5 * * *'),
            forceUpdate:
                configService.getOrThrow<string>('KKPHIM_FORCE_UPDATE', 'false') === 'true',
            maxRetries: configService.getOrThrow<number>('KKPHIM_MAX_RETRIES', 3),
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

        this.kkphim = new Ophim({ host: this.config.host });
    }

    protected shouldEnable(): boolean {
        // Only enable if KKPHIM_HOST is set and not 'false'
        const kkphimHost = this.configService.get<string>('KKPHIM_HOST');
        return !!kkphimHost && kkphimHost !== 'false';
    }

    protected async crawlMovies(): Promise<void> {
        this.logger.log('Crawling movies from KKPhim...');
        // Call base class crawl() which handles skip detection and auto-stop
        await this.crawl();
    }

    protected async getNewestMovies(page: number): Promise<any> {
        return this.kkphim.getNewestMovies({ page, limit: 24 });
    }

    protected getTotalPages(response: any): number {
        return response.pagination.totalPages;
    }

    protected getMovieItems(response: any): any[] {
        return response.items;
    }

    protected async fetchAndSaveMovieDetail(slug: string, retryCount = 0): Promise<boolean> {
        slug = slugifyVietnamese(slug);

        try {
            const movieDetail = await this.kkphim.getMovieDetail({ slug });
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

    protected async saveMovieDetail(input: {
        data?: {
            item?: OPhimMovie & {
                episodes?: OPhimServerData[];
            };
        };
    }): Promise<boolean> {
        const { data: { item: movieDetail } = {} } = input;
        const movieSlug = removeTone(removeDiacritics(movieDetail?.slug || ''));

        try {
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieSlug },
            });

            const lastModified = new Date(movieDetail?.modified?.time || 0).getTime();
            if (!this.config.forceUpdate) {
                // If not force update, check if movie was already updated
                if (
                    existingMovie &&
                    lastModified <= (existingMovie?.lastSyncModified?.kkphim || 0)
                ) {
                    // If movie was already up to date, skip
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
                view = 0,
                modified,
            } = movieDetail;

            // kkphim's `_id` is not ObjectId, from it we will create a new ObjectId
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

                lastSyncModified: {
                    ...existingMovie?.lastSyncModified,
                    kkphim: Math.max(
                        // Get modified time or default to 0
                        modified?.time ? new Date(modified.time).getTime() : 0,
                        // Get existing kkphim time or default to 0
                        existingMovie?.lastSyncModified?.kkphim
                            ? new Date(existingMovie.lastSyncModified.kkphim).getTime()
                            : 0,
                        // Ensure at least 0
                        0,
                    ),
                },

                _id: correctId,
                name: movieDetail?.name,
                slug: movieDetail?.slug || slugify(movieDetail?.name, { lower: true }),
                content: stripHtml(content || '').result || existingMovie?.content || '',
                actors: actorIds,
                categories: categoryIds,
                countries: countryIds,
                directors: directorIds,

                thumbUrl: resolveUrl(thumb_url, this.config.imgHost),
                posterUrl: resolveUrl(poster_url, this.config.imgHost),

                trailerUrl: trailer_url,
                isCopyright: is_copyright,
                originName: origin_name,
                episodeCurrent: episode_current,
                episodeTotal: episode_total,
                subDocquyen: sub_docquyen,
                cinemaRelease: chieurap,
                year,
                view: Math.max(view, existingMovie?.view || 0, 0),
                episode: this.processEpisodes(movieDetail?.episodes),
                tmdb,
                imdb,
            };

            if (existingMovie) {
                const newEpisodes = movieData?.episode?.filter(
                    (newEp) =>
                        !existingMovie.episode.some(
                            (existingEp) =>
                                existingEp.serverName === newEp.serverName &&
                                existingEp.originSrc === newEp.originSrc,
                        ),
                );
                const updateQuery: Partial<Movie> = {};
                for (const [key, value] of Object.entries(movieData)) {
                    if (!isNullOrUndefined(value)) {
                        updateQuery[key] = value;
                    }
                }
                updateQuery.episode = [...newEpisodes, ...(existingMovie?.episode ?? [])];

                await this.movieRepo.findOneAndUpdate({
                    filterQuery: { slug: movieSlug },
                    updateQuery,
                });
                this.moviesToRevalidate.push(movieSlug);
                this.logger.log(`Updated movie: "${movieSlug}"`);
            } else {
                await this.movieRepo.create({
                    document: movieData,
                });
                this.logger.log(`Saved new movie: "${movieSlug}"`);
            }
            return true;
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieSlug}: ${error}`);
            return false;
        }
    }

    protected async processCategoriesAndCountries(
        movieDetail: any,
    ): Promise<{ categories: any[]; countries: any[] }> {
        const categories = await Promise.all(
            (movieDetail?.category || []).map(async (category) => {
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
            }),
        );

        const countries = await Promise.all(
            (movieDetail?.country || []).map(async (country) => {
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
            }),
        );

        return {
            categories: categories.filter((id) => id !== null),
            countries: countries.filter((id) => id !== null),
        };
    }

    protected processEpisodes(episodes: OPhimServerData[]): any[] {
        if (!episodes?.length) return [];

        return episodes.map((server, index) => {
            const serverData: EpisodeServerData[] = (server?.server_data || [])
                .filter((item) => item) // Filter out null/undefined items
                .map((item, index) => {
                    const { name, slug } = mappingNameSlugEpisode(item, index);
                    return {
                        name: name,
                        slug: slug || `episode-${index}`, // Ensure slug is never empty
                        linkEmbed: resolveUrl(item?.link_embed),
                        linkM3u8: resolveUrl(item?.link_m3u8),
                        filename: item?.filename,
                    };
                });

            return {
                originSrc: 'kkphim',
                serverName: server?.server_name || `KK #${index + 1}`,
                serverData,
            };
        });
    }
}
