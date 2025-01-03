import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { Ophim, Movie as OPhimMovie, Server as OPhimServerData } from 'ophim-js';
import { OPhimResponseSingle } from 'ophim-js/lib/types/response-wrapper';
import slugify from 'slugify';
import { stripHtml } from 'string-strip-html';
import { removeDiacritics, removeTone } from '@vn-utils/text';

import { EpisodeServerData, Movie } from '../movie.schema';
import { MovieRepository } from '../movie.repository';
import {
    convertToObjectId,
    isNullOrUndefined,
    isTrue,
    resolveUrl,
    sleep,
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

@Injectable()
export class OphimCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly OPHIM_CRON: string = '0 2 * * *';
    private readonly RETRY_DELAY = 5000;
    private readonly OPHIM_FORCE_UPDATE: boolean = false;
    private readonly OPHIM_HOST: string = 'https://ophim1.com';
    private readonly OPHIM_IMG_HOST: string = null;
    private readonly logger = new Logger(OphimCrawler.name);
    private readonly ophim: Ophim;
    private readonly REVALIDATION_BATCH_SIZE = 40;
    private moviesToRevalidate: string[] = [];

    constructor(
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly redisService: RedisService,
        private readonly movieRepo: MovieRepository,
        private readonly actorRepo: ActorRepository,
        private readonly categoryRepo: CategoryRepository,
        private readonly directorRepo: DirectorRepository,
        private readonly regionRepo: RegionRepository,
        private readonly httpService: HttpService,
    ) {
        if (!isNullOrUndefined(this.configService.get('OPHIM_HOST'))) {
            this.OPHIM_HOST = this.configService.getOrThrow<string>('OPHIM_HOST');
            this.ophim = new Ophim({
                host: this.OPHIM_HOST,
            });
        }

        if (!isNullOrUndefined(this.configService.get('OPHIM_CRON'))) {
            this.OPHIM_CRON = this.configService.getOrThrow<string>('OPHIM_CRON');
        }

        if (!isNullOrUndefined(this.configService.get('OPHIM_FORCE_UPDATE'))) {
            this.OPHIM_FORCE_UPDATE = isTrue(
                this.configService.getOrThrow<boolean>('OPHIM_FORCE_UPDATE'),
            );
        }

        if (!isNullOrUndefined(this.configService.get('OPHIM_IMG_HOST'))) {
            this.OPHIM_IMG_HOST = this.configService.getOrThrow<string>('OPHIM_IMG_HOST');
        }

        this.logger.log({
            ophim_cron: this.OPHIM_CRON,
            tz: process.env.TZ,
            tzOffset: new Date().getTimezoneOffset(),
        });
    }

    onModuleInit() {
        if (!isNullOrUndefined(this.OPHIM_HOST)) {
            const crawMovieJob = new CronJob(this.OPHIM_CRON, this.crawMovie.bind(this));
            this.schedulerRegistry.addCronJob(this.crawMovie.name, crawMovieJob);
            crawMovieJob.start();
        }
    }

    onModuleDestroy() {
        if (!isNullOrUndefined(this.OPHIM_HOST)) {
            this.schedulerRegistry.deleteCronJob(this.crawMovie.name);
        }
    }

    async crawMovie() {
        this.logger.log('Crawling movie from Ophim ...');
        return this.crawl();
    }

    async crawl() {
        const today = new Date().toISOString().slice(0, 10); // Get date in YYYY-MM-DD format
        const crawlKey = `crawled-pages:${this.OPHIM_HOST}:${today}`;

        try {
            const latestMovies = await this.ophim.getNewestMovies({ page: 1 });
            const totalPages = latestMovies.pagination.totalPages;

            // Get last crawled page from Redis
            let lastCrawledPage = 0;
            try {
                lastCrawledPage = parseInt(await this.redisService.get(crawlKey)) || 0;
            } catch (error) {
                this.logger.error(`Error getting last crawled page from Redis: ${error}`);
            }

            // Crawl from the last crawled page or from the beginning
            for (let i = lastCrawledPage; i <= totalPages; i++) {
                await this.crawlPage(i);

                // Cache the last crawled page for 24 hours
                await this.redisService.set(crawlKey, i, 60 * 60 * 24 * 1000);

                // Revalidate all updated movies at once
                if (
                    this.moviesToRevalidate.length > 0 &&
                    this.moviesToRevalidate.length >= this.REVALIDATION_BATCH_SIZE
                ) {
                    await this.revalidateMovies();
                }
            }

            // Retry failed crawls after the main crawl is done (max 3 attempts)
            for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
                await this.retryFailedCrawls();
            }

            // Revalidate all updated movies at once when all pages are crawled
            if (this.moviesToRevalidate.length > 0) {
                await this.revalidateMovies();
            }
        } catch (error) {
            this.logger.error(`Error crawling movies: ${error}`);
        }
    }

    private async crawlPage(page: number) {
        try {
            const latestMovies = await this.ophim.getNewestMovies({ page });
            for (const movie of latestMovies.items) {
                if (movie?.slug) {
                    await this.fetchAndSaveMovieDetail(removeTone(removeDiacritics(movie.slug)));
                }
            }
        } catch (error) {
            this.logger.error(`Error crawling page ${page}: ${error}`);
            await sleep(this.RETRY_DELAY);

            // Retry crawling the page
            return this.crawlPage(page);
        }
    }

    private async fetchAndSaveMovieDetail(slug: string) {
        try {
            const movieDetail = await this.ophim.getMovieDetail({ slug });
            if (movieDetail) {
                await this.saveMovieDetail(movieDetail);
            }
        } catch (error) {
            this.logger.error(`Error fetching movie detail for slug ${slug}: ${error}`);
            return this.addToFailedCrawls(slug);
        }
    }

    private async saveMovieDetail(
        input: OPhimResponseSingle<
            OPhimMovie & {
                episodes?: OPhimServerData[];
            }
        >,
    ) {
        const { data: { item: movieDetail } = {} } = input;
        const movieSlug = removeTone(removeDiacritics(movieDetail?.slug || ''));

        try {
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieSlug },
            });

            const lastModified = new Date(movieDetail.modified.time);
            if (
                !this.OPHIM_FORCE_UPDATE &&
                existingMovie &&
                lastModified <= existingMovie?.lastSyncModified
            ) {
                this.logger.log(`Movie "${movieDetail?.slug}" is up to date. Skipping...`);
                return;
            }

            // Save categories
            const categoryIds = await Promise.all(
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
                }),
            );

            // Save countries
            const countryIds = await Promise.all(
                movieDetail?.country?.map(async (country) => {
                    if (isNullOrUndefined(country) || !country?.name || !country?.slug) {
                        return null;
                    }
                    const existingCountry = await this.regionRepo.findOne({
                        filterQuery: {
                            slug: country.slug,
                        },
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

            const actorIds = await Promise.all(
                movieDetail?.actor?.map(async (actor) => {
                    if (isNullOrUndefined(actor) || !actor) {
                        return null;
                    }
                    const existingActor = await this.actorRepo.findOne({
                        filterQuery: { slug: slugify(actor, { lower: true }) || actor },
                    });
                    if (existingActor) {
                        return existingActor._id;
                    } else {
                        const newActor = await this.actorRepo.create({
                            document: {
                                name: actor,
                                slug: slugify(actor, { lower: true }) || actor,
                            },
                        });
                        return newActor._id;
                    }
                }),
            );

            const directorIds = await Promise.all(
                movieDetail?.director?.map(async (director) => {
                    if (isNullOrUndefined(director) || !director) {
                        return null;
                    }
                    const existingDirector = await this.directorRepo.findOne({
                        filterQuery: { slug: slugify(director, { lower: true }) || director },
                    });
                    if (existingDirector) {
                        return existingDirector._id;
                    } else {
                        const newDirector = await this.directorRepo.create({
                            document: {
                                name: director,
                                slug: slugify(director, { lower: true }) || director,
                            },
                        });
                        return newDirector._id;
                    }
                }),
            );

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

            // Save movie
            const movieData: Movie = {
                ...(existingMovie || {}),
                ...movieDetail,

                // Mapping data
                type: MOVIE_TYPE_MAP[movieDetail?.type] || 'N/A',
                time: convertToVietnameseTime(movieDetail?.time || existingMovie?.time),
                quality: mapQuality(movieDetail?.quality || existingMovie?.quality),
                lang: mapLanguage(movieDetail?.lang || existingMovie?.lang),
                status: mapStatus(movieDetail?.status || existingMovie?.status),
                view: Math.max(view, existingMovie?.view || 0, 0),

                lastSyncModified: new Date(
                    Math.max(
                        modified?.time ? new Date(modified?.time).getTime() : 0,
                        !isNullOrUndefined(existingMovie?.lastSyncModified)
                            ? new Date(existingMovie.lastSyncModified).getTime()
                            : 0,
                        0,
                    ),
                ),

                _id: correctId,
                name: movieDetail?.name,
                slug: movieDetail?.slug || slugify(movieDetail?.name, { lower: true }),
                content: stripHtml(content || '').result || existingMovie?.content || '',
                actors: actorIds,
                categories: categoryIds,
                countries: countryIds,
                directors: directorIds,
                thumbUrl: resolveUrl(thumb_url, this.OPHIM_IMG_HOST),
                posterUrl: resolveUrl(poster_url, this.OPHIM_IMG_HOST),
                trailerUrl: trailer_url,
                isCopyright: is_copyright,
                originName: origin_name,
                episodeCurrent: episode_current,
                episodeTotal: episode_total,
                subDocquyen: sub_docquyen,
                cinemaRelease: chieurap,
                year,
                episode: movieDetail?.episodes?.map((server, index) => {
                    const serverData: EpisodeServerData[] = server?.server_data?.map(
                        (item, index) => {
                            const { name, slug } = mappingNameSlugEpisode(item, index);
                            return {
                                name: name,
                                slug: slug,
                                linkEmbed: resolveUrl(item?.link_embed),
                                linkM3u8: resolveUrl(item?.link_m3u8),
                                filename: item?.filename,
                            };
                        },
                    );

                    return {
                        originSrc: 'ophim',
                        serverName: server?.server_name || `OP #${index + 1}`,
                        serverData,
                    };
                }),
                tmdb: {
                    ...movieDetail?.tmdb,
                    voteAverage: movieDetail?.tmdb?.vote_average,
                    voteCount: movieDetail?.tmdb?.vote_count,
                },
                imdb: movieDetail?.imdb,
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
                this.logger.log(`Saved movie: "${movieSlug}"`);
            }
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieSlug}: ${error}`);
        }
    }

    private async addToFailedCrawls(slug: string) {
        try {
            await this.redisService.getClient.sadd(`failed-movie-crawls-${this.OPHIM_HOST}`, slug);
            await this.redisService.getClient.expire(
                `failed-movie-crawls-${this.OPHIM_HOST}`,
                60 * 60 * 12,
            ); // Expire in 12 hours
        } catch (error) {
            this.logger.error(`Error adding slug ${slug} to failed crawls: ${error}`);
        }
    }

    private async retryFailedCrawls() {
        try {
            const failedSlugs = await this.redisService.getClient.smembers(
                `failed-movie-crawls-${this.OPHIM_HOST}`,
            );
            if (failedSlugs?.length === 0) {
                return;
            }

            for (const slug of failedSlugs) {
                try {
                    await this.fetchAndSaveMovieDetail(slug);
                    // If successful, remove from the failed set
                    await this.redisService.getClient.srem(
                        `failed-movie-crawls-${this.OPHIM_HOST}`,
                        slug,
                    );
                } catch (error) {
                    // Log the error but don't stop processing other slugs
                    this.logger.error(`Error retrying crawl for slug ${slug}: ${error}`);
                }
            }
        } catch (error) {
            this.logger.error(`Error during retryFailedCrawls: ${error}`);
        }
    }

    private async revalidateMovies() {
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
}
