import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { Ophim, Movie as OPhimMovie, Server as OPhimServerData } from 'ophim-js';
import slugify from 'slugify';
import { stripHtml } from 'string-strip-html';

import { EpisodeServerData, Movie } from './movie.schema';
import { MovieRepository } from './movie.repository';
import { convertToObjectId, isNullOrUndefined, resolveUrl, sleep } from '../../libs/utils/common';
import { ActorRepository } from '../actors';
import { RedisService } from '../../libs/modules/redis';
import { CategoryRepository } from '../categories';
import { RegionRepository } from '../regions/region.repository';
import { DirectorRepository } from '../directors';
import { OPhimResponseSingle } from 'ophim-js/lib/types/response-wrapper';

@Injectable()
export class MovieCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly MOVIE_CRON: string = '0 2 * * *';
    private readonly RETRY_DELAY = 500;
    private readonly logger = new Logger(MovieCrawler.name);
    private readonly ophim: Ophim;

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
        if (!isNullOrUndefined(this.configService.get('MOVIE_CRON'))) {
            this.MOVIE_CRON = this.configService.getOrThrow<string>('MOVIE_CRON');
        }

        this.ophim = new Ophim({
            host: configService.get('OPHIM_HOST'),
        });
    }

    onModuleInit() {
        const crawMovieJob = new CronJob(this.MOVIE_CRON, this.crawMovie.bind(this));
        this.schedulerRegistry.addCronJob(this.crawMovie.name, crawMovieJob);
        crawMovieJob.start();
    }

    onModuleDestroy() {
        this.schedulerRegistry.deleteCronJob(this.crawMovie.name);
    }

    async crawMovie() {
        this.logger.log('Crawling movie ...');
        return this.crawl();
    }

    async crawl() {
        const today = new Date().toISOString().slice(0, 10); // Get date in YYYY-MM-DD format
        const crawlKey = `crawled-pages:${today}`;

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
            for (let i = lastCrawledPage + 1; i <= totalPages; i++) {
                await this.crawlPage(i);

                await Promise.allSettled([
                    this.redisService.set(crawlKey, i, 60 * 60 * 24 * 1000), // Cache the last crawled page for 24 hours
                    sleep(this.RETRY_DELAY),
                ]);
            }
        } catch (error) {
            this.logger.error(`Error crawling movies: ${error}`);
        }
    }

    private async crawlPage(page: number) {
        try {
            const latestMovies = await this.ophim.getNewestMovies({ page });
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
            const movieDetail = await this.ophim.getMovieDetail({ slug });
            if (movieDetail) {
                await this.saveMovieDetail(movieDetail);
            }
        } catch (error) {
            this.logger.error(`Error fetching movie detail for slug ${slug}: ${error}`);
            await sleep(this.RETRY_DELAY);

            // Retry fetching and saving movie details
            return this.fetchAndSaveMovieDetail(slug);
        }
    }

    private async saveMovieDetail(
        input: OPhimResponseSingle<
            OPhimMovie & {
                episodes?: OPhimServerData[];
            }
        >,
    ) {
        const { data: { item: movieDetail, APP_DOMAIN_CDN_IMAGE } = {} } = input;

        try {
            const lastModified = new Date(movieDetail.modified.time);
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieDetail.slug },
            });

            if (existingMovie && lastModified <= existingMovie.updatedAt) {
                this.logger.log(`Movie "${movieDetail.name}" is up to date. Skipping...`);
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
            } = movieDetail;

            // Save movie
            const movieData: Movie = {
                ...movieDetail,
                _id: _id ? convertToObjectId(_id) : new Types.ObjectId(),
                name: movieDetail?.name,
                slug: movieDetail?.slug || slugify(movieDetail.name, { lower: true }),
                content: stripHtml(content || '').result || '',
                actors: actorIds,
                categories: categoryIds,
                countries: countryIds,
                directors: directorIds,
                thumbUrl: resolveUrl(thumb_url, APP_DOMAIN_CDN_IMAGE),
                posterUrl: resolveUrl(poster_url, APP_DOMAIN_CDN_IMAGE),
                trailerUrl: resolveUrl(trailer_url, APP_DOMAIN_CDN_IMAGE),
                isCopyright: is_copyright,
                originName: origin_name,
                episodeCurrent: episode_current,
                episodeTotal: episode_total,
                subDocquyen: sub_docquyen,
                cinemaRelease: chieurap,
                episode: movieDetail?.episodes?.map((episode) => {
                    const serverData: EpisodeServerData[] = episode?.server_data?.map((server) => {
                        return {
                            linkEmbed: resolveUrl(server?.link_embed),
                            linkM3u8: resolveUrl(server?.link_m3u8),
                            filename: server?.filename,
                            name: server?.name,
                            slug: server?.slug,
                        };
                    });

                    return {
                        serverName: episode.server_name,
                        serverData,
                    };
                }),
            };

            if (existingMovie) {
                await this.movieRepo.findOneAndUpdate({
                    filterQuery: { slug: movieDetail.slug },
                    updateQuery: movieData,
                });
                this.logger.log(`Updated movie: "${movieDetail.name}"`);
            } else {
                await this.movieRepo.create({
                    document: movieData,
                });
                this.logger.log(`Saved movie: "${movieDetail.name}"`);
            }
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieDetail.name}: ${error}`);
        }
    }
}
