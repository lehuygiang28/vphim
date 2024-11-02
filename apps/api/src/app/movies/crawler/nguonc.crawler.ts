/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { stripHtml } from 'string-strip-html';
import { removeDiacritics, removeTone } from '@vn-utils/text';

import { EpisodeServerData, Movie, Episode } from './../movie.schema';
import { MovieRepository } from './../movie.repository';
import {
    convertToObjectId,
    isNullOrUndefined,
    isTrue,
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
import { AbstractRepository } from 'apps/api/src/libs/abstract/abstract.repository';
import { MovieTypeEnum } from '../movie.constant';

@Injectable()
export class NguoncCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly NGUONC_CRON: string = '0 6 * * *';
    private readonly RETRY_DELAY = 5000;
    private readonly NGUONC_FORCE_UPDATE: boolean = true;
    private readonly NGUONC_HOST: string = 'https://phim.nguonc.com/api';
    private readonly logger = new Logger(NguoncCrawler.name);
    private readonly REVALIDATION_BATCH_SIZE = 40;
    private moviesToRevalidate: string[] = [];

    constructor(
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly redisService: RedisService,
        private readonly httpService: HttpService,
        private readonly movieRepo: MovieRepository,
        private readonly actorRepo: ActorRepository,
        private readonly categoryRepo: CategoryRepository,
        private readonly directorRepo: DirectorRepository,
        private readonly regionRepo: RegionRepository,
    ) {
        if (!isNullOrUndefined(this.configService.get('NGUONC_CRON'))) {
            this.NGUONC_CRON = this.configService.getOrThrow<string>('NGUONC_CRON');
        }

        if (!isNullOrUndefined(this.configService.get('NGUONC_FORCE_UPDATE'))) {
            this.NGUONC_FORCE_UPDATE = isTrue(
                this.configService.getOrThrow<boolean>('NGUONC_FORCE_UPDATE'),
            );
        }

        this.logger.log({
            nguonc_cron: this.NGUONC_CRON,
            tz: process.env.TZ,
            tzOffset: new Date().getTimezoneOffset(),
        });
    }

    onModuleInit() {
        const crawMovieJob = new CronJob(this.NGUONC_CRON, this.crawMovieFromNguonc.bind(this));
        this.schedulerRegistry.addCronJob(this.crawMovieFromNguonc.name, crawMovieJob);
        crawMovieJob.start();
    }

    onModuleDestroy() {
        this.schedulerRegistry.deleteCronJob(this.crawMovieFromNguonc.name);
    }

    async crawMovieFromNguonc() {
        this.logger.log('Crawling movie from Nguonc ...');
        return this.crawl();
    }

    async crawl() {
        const today = new Date().toISOString().slice(0, 10);
        const crawlKey = `crawled-pages:${this.NGUONC_HOST}:${today}`;

        try {
            const latestMovies = await this.getNewestMovies(1);
            const totalPages = latestMovies.paginate.total_page;

            let lastCrawledPage = 0;
            try {
                lastCrawledPage = parseInt(await this.redisService.get(crawlKey)) || 0;
            } catch (error) {
                this.logger.error(`Error getting last crawled page from Redis: ${error}`);
            }

            for (let i = lastCrawledPage; i <= totalPages; i++) {
                await this.crawlPage(i);
                await this.redisService.set(crawlKey, i, 60 * 60 * 24 * 1000);

                // Revalidate all updated movies at once
                if (
                    this.moviesToRevalidate.length > 0 &&
                    this.moviesToRevalidate.length >= this.REVALIDATION_BATCH_SIZE
                ) {
                    await this.revalidateMovies();
                }
            }

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
            const latestMovies = await this.getNewestMovies(page);
            for (const movie of latestMovies.items) {
                if (movie?.slug) {
                    await this.fetchAndSaveMovieDetail(removeTone(removeDiacritics(movie?.slug)));
                }
            }
        } catch (error) {
            this.logger.error(`Error crawling page ${page}: ${error}`);
            await sleep(this.RETRY_DELAY);
            return this.crawlPage(page);
        }
    }

    private async getNewestMovies(page: number) {
        const response = await this.httpService.axiosRef.get(
            `${this.NGUONC_HOST}/films/phim-moi-cap-nhat?page=${page}`,
        );
        return response.data;
    }

    private async fetchAndSaveMovieDetail(slug: string, retryCount = 0) {
        try {
            const response = await this.httpService.axiosRef.get(
                `${this.NGUONC_HOST}/film/${slug}`,
            );
            const movieDetail = response.data.movie;
            if (movieDetail) {
                await this.saveMovieDetail(movieDetail);
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                if (retryCount < 5) {
                    // Max 5 retries
                    const delay = this.calculateBackoff(retryCount);
                    this.logger.warn(`Rate limited for slug ${slug}. Retrying in ${delay}ms...`);
                    await sleep(delay);
                    return this.fetchAndSaveMovieDetail(slug, retryCount + 1);
                } else {
                    this.logger.error(`Max retries reached for slug ${slug}`);
                }
            }
            if (error instanceof HttpException) {
                this.logger.error(
                    `HTTP error fetching movie detail for slug ${slug}: ${error.message}`,
                );
            } else {
                this.logger.error(`Error fetching movie detail for slug ${slug}: ${error}`);
            }
            return this.addToFailedCrawls(slug);
        }
    }

    private calculateBackoff(retryCount: number): number {
        // Exponential backoff with jitter
        const baseDelay = 1000; // 1 second
        const maxDelay = 60000; // 1 minute
        const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
        const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
        return exponentialDelay + jitter;
    }

    private async saveMovieDetail(movieDetail: any) {
        const movieSlug = removeTone(removeDiacritics(movieDetail?.slug || ''));
        try {
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieSlug },
            });

            const lastModified = new Date(movieDetail?.modified || Date.now());
            if (
                !this.NGUONC_FORCE_UPDATE &&
                existingMovie &&
                existingMovie.lastSyncModified &&
                lastModified <= existingMovie?.lastSyncModified
            ) {
                this.logger.log(`Movie "${movieDetail?.slug}" is up to date. Skipping...`);
                return;
            }

            const [{ categories, countries }, actorIds, directorIds] = await Promise.all([
                this.processCategoriesAndCountries(movieDetail.category),
                this.processActors(movieDetail.casts),
                this.processDirectors(movieDetail.director),
            ]);

            const yearCategory = (Object.values(movieDetail.category || {}) as any[]).find(
                (group: any) => group?.group?.name?.toLowerCase() === 'năm',
            );
            const year =
                existingMovie?.year ||
                (yearCategory?.list?.[0]?.name ? parseInt(yearCategory.list[0].name) : null);

            const {
                id,
                name,
                slug,
                original_name,
                thumb_url,
                poster_url,
                description,
                total_episodes,
                current_episode,
                modified,
                episodes,

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                time,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                quality,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                language,
            } = movieDetail;

            let correctId: Types.ObjectId;
            try {
                correctId = convertToObjectId(id);
            } catch (error) {
                correctId = new Types.ObjectId();
            }

            const processedEpisodes = this.processEpisodes(episodes, existingMovie?.episode || []);

            const processedSlug =
                existingMovie?.slug ||
                slugifyVietnamese(slug?.toString() || '', { lower: true }) ||
                slugifyVietnamese(name?.toString() || '', { lower: true });
            const movieData: Partial<Movie> = {
                ...(existingMovie || {}),

                // Mapping data
                type:
                    MOVIE_TYPE_MAP[this.processMovieType(movieDetail) || existingMovie?.type] ||
                    'N/A',
                time: convertToVietnameseTime(movieDetail?.time || existingMovie?.time),
                quality: mapQuality(movieDetail?.quality || existingMovie?.quality),
                lang: mapLanguage(movieDetail?.lang || existingMovie?.lang),
                status: mapStatus(existingMovie?.status || this.processMovieStatus(movieDetail)),
                // nguonc not provide view
                // view: Math.max(view, existingMovie?.view || 0, 0),

                lastSyncModified: new Date(
                    Math.max(
                        modified ? new Date(modified).getTime() : 0,
                        !isNullOrUndefined(existingMovie?.lastSyncModified)
                            ? new Date(existingMovie.lastSyncModified).getTime()
                            : 0,
                        0,
                    ),
                ),

                _id: correctId,
                slug: processedSlug,
                content: description
                    ? stripHtml(description.toString()).result
                    : existingMovie?.content || '',
                actors: actorIds.length > 0 ? actorIds : existingMovie?.actors || [],
                categories: categories.length > 0 ? categories : existingMovie?.categories || [],
                countries: countries.length > 0 ? countries : existingMovie?.countries || [],
                directors:
                    directorIds && directorIds?.length > 0
                        ? directorIds
                        : existingMovie?.directors || [],
                thumbUrl: existingMovie?.thumbUrl || thumb_url || '',
                posterUrl: existingMovie?.posterUrl || poster_url || '',

                name: existingMovie?.name || name || '',
                originName: existingMovie?.originName || original_name || '',
                episodeTotal: existingMovie?.episodeTotal || total_episodes?.toString() || '',
                episodeCurrent: existingMovie?.episodeCurrent || current_episode || '',
                year: existingMovie?.year || year || null,
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
                await this.movieRepo.create({
                    document: movieData as Movie,
                });
                this.logger.log(`Saved movie: "${movieSlug}"`);
            }
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieSlug}: ${error}`);
        }
    }

    private processMovieStatus(movieDetail: any) {
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

    private processMovieType(movieDetail: any): MovieTypeEnum {
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

    private async processCategoriesAndCountries(category: any) {
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

    private async processActors(casts: string) {
        const actorNames = (casts || '')
            .split(',')
            ?.map((name) => name?.toString()?.trim())
            .filter((actor) => !isNullOrUndefined(actor) && !!actor);
        return this.processEntities(actorNames || [], this.actorRepo);
    }

    private async processDirectors(directors: string) {
        const directorNames = (directors || '')
            .split(',')
            ?.map((name) => name?.toString()?.trim())
            .filter((director) => !isNullOrUndefined(director) && !!director);
        return this.processEntities(directorNames || [], this.directorRepo);
    }

    private async processEntities(names: string[], repo: AbstractRepository<any>) {
        if (isNullOrUndefined(names) || !names?.length) {
            return [];
        }
        const entities = await Promise.all(
            names?.map(async (name) => {
                name = name?.toString()?.trim();
                // Ensure name is a string and not empty
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

    private processEpisodes(newEpisodes: any[], existingEpisodes: Episode[] = []): Episode[] {
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

    private async addToFailedCrawls(slug: string) {
        try {
            await this.redisService.getClient.sadd(`failed-movie-crawls-${this.NGUONC_HOST}`, slug);
            await this.redisService.getClient.expire(
                `failed-movie-crawls-${this.NGUONC_HOST}`,
                60 * 60 * 12,
            );
        } catch (error) {
            this.logger.error(`Error adding slug ${slug} to failed crawls: ${error}`);
        }
    }

    private async retryFailedCrawls() {
        try {
            const failedSlugs = await this.redisService.getClient.smembers(
                `failed-movie-crawls-${this.NGUONC_HOST}`,
            );
            if (failedSlugs?.length === 0) {
                return;
            }

            for (const slug of failedSlugs) {
                try {
                    await this.fetchAndSaveMovieDetail(slug);
                    await this.redisService.getClient.srem(
                        `failed-movie-crawls-${this.NGUONC_HOST}`,
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
