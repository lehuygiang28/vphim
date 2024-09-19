import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { Ophim, Movie as OPhimMovie, Server as OPhimServerData } from 'ophim-js';
import { OPhimResponseSingle } from 'ophim-js/lib/types/response-wrapper';
import slugify from 'slugify';
import { stripHtml } from 'string-strip-html';
import {
    MOVIE_TYPE_MAP,
    convertToVietnameseTime,
    mapLanguage,
    mapQuality,
    mapStatus,
} from './mapping-data';

import { EpisodeServerData, Movie } from './../movie.schema';
import { MovieRepository } from './../movie.repository';
import {
    convertToObjectId,
    isNullOrUndefined,
    isTrue,
    resolveUrl,
    sleep,
    slugifyVietnamese,
} from '../../../libs/utils/common';
import { ActorRepository } from '../../actors';
import { RedisService } from '../../../libs/modules/redis';
import { CategoryRepository } from '../../categories';
import { RegionRepository } from '../../regions/region.repository';
import { DirectorRepository } from '../../directors';

@Injectable()
export class KKPhimCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly KKPHIM_CRON: string = '0 4 * * *';
    private readonly RETRY_DELAY = 5000;
    private readonly KKPHIM_FORCE_UPDATE: boolean = false;
    private readonly KKPHIM_HOST: string = null;
    private readonly KKPHIM_IMG_HOST: string = null;
    private readonly logger = new Logger(KKPhimCrawler.name);
    private readonly kkphim: Ophim;

    constructor(
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly redisService: RedisService,
        private readonly movieRepo: MovieRepository,
        private readonly actorRepo: ActorRepository,
        private readonly categoryRepo: CategoryRepository,
        private readonly directorRepo: DirectorRepository,
        private readonly regionRepo: RegionRepository,
    ) {
        if (!isNullOrUndefined(this.configService.get('KKPHIM_HOST'))) {
            this.KKPHIM_HOST = this.configService.getOrThrow<string>('KKPHIM_HOST');
            this.kkphim = new Ophim({
                host: this.KKPHIM_HOST,
            });
        }

        if (!isNullOrUndefined(this.configService.get('KKPHIM_CRON'))) {
            this.KKPHIM_CRON = this.configService.getOrThrow<string>('KKPHIM_CRON');
        }

        if (!isNullOrUndefined(this.configService.get('KKPHIM_FORCE_UPDATE'))) {
            this.KKPHIM_FORCE_UPDATE = isTrue(
                this.configService.getOrThrow<boolean>('KKPHIM_FORCE_UPDATE'),
            );
        }

        if (!isNullOrUndefined(this.configService.get('KKPHIM_IMG_HOST'))) {
            this.KKPHIM_IMG_HOST = this.configService.getOrThrow<string>('KKPHIM_IMG_HOST');
        }
    }

    onModuleInit() {
        if (!isNullOrUndefined(this.KKPHIM_HOST)) {
            const crawMovieJob = new CronJob(this.KKPHIM_CRON, this.crawMovieFromKK.bind(this));
            this.schedulerRegistry.addCronJob(this.crawMovieFromKK.name, crawMovieJob);
            crawMovieJob.start();
        }
    }

    onModuleDestroy() {
        if (!isNullOrUndefined(this.KKPHIM_HOST)) {
            this.schedulerRegistry.deleteCronJob(this.crawMovieFromKK.name);
        }
    }

    async crawMovieFromKK() {
        this.logger.log('Crawling movie ...');
        return this.crawl();
    }

    async crawl() {
        const today = new Date().toISOString().slice(0, 10); // Get date in YYYY-MM-DD format
        const crawlKey = `crawled-pages:${this.KKPHIM_HOST}:${today}`;

        try {
            const latestMovies = await this.kkphim.getNewestMovies({ page: 1 });
            const totalPages = latestMovies.pagination.totalPages;

            // Get last crawled page from Redis
            let lastCrawledPage = 0;
            try {
                lastCrawledPage = parseInt(await this.redisService.get(crawlKey)) || 0;
            } catch (error) {
                this.logger.error(`Error getting last crawled page from Redis: ${error}`);
            }

            // Crawl from the last crawled page or from the beginning
            for (let i = lastCrawledPage + 1; i <= totalPages; i++) {
                await this.crawlPage(i);

                await Promise.allSettled([
                    this.redisService.set(crawlKey, i, 60 * 60 * 24 * 1000), // Cache the last crawled page for 24 hours
                ]);
            }

            // Retry failed crawls after the main crawl is done (max 3 attempts)
            for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
                await this.retryFailedCrawls();
            }
        } catch (error) {
            this.logger.error(`Error crawling movies: ${error}`);
        }
    }

    private async crawlPage(page: number) {
        try {
            const latestMovies = await this.kkphim.getNewestMovies({ page, limit: 24 });
            for (const movie of latestMovies.items) {
                await this.fetchAndSaveMovieDetail(movie.slug);
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
            const movieDetail = await this.kkphim.getMovieDetail({ slug });
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

        try {
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieDetail.slug },
            });

            const lastModified = new Date(movieDetail.modified.time);
            if (
                !this.KKPHIM_FORCE_UPDATE &&
                existingMovie &&
                lastModified <= existingMovie?.lastSyncModified
            ) {
                this.logger.log(`Movie "${movieDetail?.slug}" is up to date. Skipping...`);
                return;
            }

            // Save categories
            const categoryIds = await Promise.all(
                movieDetail.category.map(async (category) => {
                    if (!category) {
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
                movieDetail.country.map(async (country) => {
                    if (!country) {
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
                movieDetail.actor.map(async (actor) => {
                    if (!actor) {
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
                movieDetail.director.map(async (director) => {
                    if (!director) {
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
                view = 0,
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

                lastSyncModified: new Date(modified?.time),
                _id: correctId,
                name: movieDetail?.name,
                slug: movieDetail?.slug || slugify(movieDetail?.name, { lower: true }),
                content: stripHtml(content || '').result || existingMovie?.content || '',
                actors: actorIds,
                categories: categoryIds,
                countries: countryIds,
                directors: directorIds,

                // With kkphim should reverse thumb and poster, because thumb should is vertical image
                thumbUrl: resolveUrl(poster_url, this.KKPHIM_IMG_HOST),
                posterUrl: resolveUrl(thumb_url, this.KKPHIM_IMG_HOST),
                // With kkphim should reverse thumb and poster, because thumb should is vertical image

                trailerUrl: trailer_url,
                isCopyright: is_copyright,
                originName: origin_name,
                episodeCurrent: episode_current,
                episodeTotal: episode_total,
                subDocquyen: sub_docquyen,
                cinemaRelease: chieurap,
                year,
                view: Math.max(view, existingMovie?.view || 0, 0),
                episode: movieDetail?.episodes?.map((server, index) => {
                    const serverData: EpisodeServerData[] = server?.server_data?.map(
                        (item, index) => {
                            let name = item?.name;
                            if (!name || !isNaN(Number(name))) {
                                name = `Tập ${index + 1 < 10 ? '0' : ''}${index + 1}`;
                            }
                            const slug = slugifyVietnamese(item?.name, { lower: true });
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
                        serverName: server?.server_name || `KK #${index + 1}`,
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
                            (existingEp) => existingEp.serverName === newEp.serverName,
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
                    filterQuery: { slug: movieDetail.slug },
                    updateQuery,
                });
                this.logger.log(`Updated movie: "${movieDetail.slug}"`);
            } else {
                await this.movieRepo.create({
                    document: movieData,
                });
                this.logger.log(`Saved movie: "${movieDetail.slug}"`);
            }
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieDetail.slug}: ${error}`);
        }
    }

    private async addToFailedCrawls(slug: string) {
        try {
            await this.redisService.getClient.sadd(`failed-movie-crawls-${this.KKPHIM_HOST}`, slug);
            await this.redisService.getClient.expire(
                `failed-movie-crawls-${this.KKPHIM_HOST}`,
                60 * 60 * 12,
            ); // Expire in 12 hours
        } catch (error) {
            this.logger.error(`Error adding slug ${slug} to failed crawls: ${error}`);
        }
    }

    private async retryFailedCrawls() {
        try {
            const failedSlugs = await this.redisService.getClient.smembers(
                `failed-movie-crawls-${this.KKPHIM_HOST}`,
            );
            if (failedSlugs?.length === 0) {
                return;
            }

            for (const slug of failedSlugs) {
                try {
                    await this.fetchAndSaveMovieDetail(slug);
                    // If successful, remove from the failed set
                    await this.redisService.getClient.srem(
                        `failed-movie-crawls-${this.KKPHIM_HOST}`,
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
}