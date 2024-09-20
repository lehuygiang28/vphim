/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { stripHtml } from 'string-strip-html';
import { parse } from 'node:url';

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
    mapQuality,
    mapStatus,
    MOVIE_TYPE_MAP,
} from './mapping-data';

@Injectable()
export class NguoncCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly NGUONC_CRON: string = '0 6 * * *';
    private readonly RETRY_DELAY = 5000;
    private readonly NGUONC_FORCE_UPDATE: boolean = true;
    private readonly NGUONC_HOST: string = 'https://phim.nguonc.com/api';
    private readonly logger = new Logger(NguoncCrawler.name);

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
            }

            for (let retryAttempt = 0; retryAttempt < 3; retryAttempt++) {
                await this.retryFailedCrawls();
            }
        } catch (error) {
            this.logger.error(`Error crawling movies: ${error}`);
        }
    }

    private async crawlPage(page: number) {
        try {
            const latestMovies = await this.getNewestMovies(page);
            for (const movie of latestMovies.items) {
                await this.fetchAndSaveMovieDetail(movie.slug);
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
        try {
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieDetail.slug },
            });

            const lastModified = new Date(movieDetail?.modified || Date.now());
            if (
                !this.NGUONC_FORCE_UPDATE &&
                existingMovie &&
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
                (group: any) => group?.group?.name === 'Năm',
            );
            const year = yearCategory?.list?.[0]?.name ? parseInt(yearCategory.list[0].name) : null;

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

                _id: correctId,
                slug: existingMovie?.slug
                    ? existingMovie.slug
                    : slug ||
                      (name
                          ? slugifyVietnamese(name.toString(), { lower: true })
                          : existingMovie?.slug || ''),
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
                thumbUrl: thumb_url || existingMovie?.thumbUrl || '',
                posterUrl: poster_url || existingMovie?.posterUrl || '',

                name: existingMovie?.name || name || '',
                originName: existingMovie?.originName || original_name || '',
                episodeTotal: existingMovie?.episodeTotal || total_episodes?.toString() || '',
                episodeCurrent: existingMovie?.episodeCurrent || current_episode || '',
                year: existingMovie?.year || year || null,
                lastSyncModified: new Date(modified || Date.now()),
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
                    filterQuery: { slug: movieDetail.slug },
                    updateQuery,
                });
                this.logger.log(`Updated movie: "${movieDetail.slug}"`);
            } else {
                await this.movieRepo.create({
                    document: movieData as Movie,
                });
                this.logger.log(`Saved movie: "${movieDetail.slug}"`);
            }
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieDetail?.slug}: ${error}`);
        }
    }

    private processMovieStatus(movieDetail: any) {
        const currentEpisode: string = movieDetail?.current_episode;
        if (currentEpisode?.includes('Hoàn tất')) {
            return 'completed';
        }
        if (currentEpisode?.includes('Tập')) {
            return 'ongoing';
        }
        if (currentEpisode?.includes('Đang cập nhật')) {
            return 'updating';
        }
        return null;
    }

    private processMovieType(movieDetail: any) {
        const movieTypeCate = (Object.values(movieDetail.category || {}) as any[]).find(
            (group: any) => group?.group?.name?.toLowerCase() === 'định dạng',
        );
        const movieType = movieTypeCate?.list?.[0]?.name
            ? MOVIE_TYPE_MAP[movieTypeCate?.list?.[0]?.name?.toLowerCase()]
            : null;

        return movieType;
    }

    private async processCategoriesAndCountries(category: any) {
        const categories = [];
        let countries = [];

        for (const group of Object.values<any>(category || {})) {
            if (group.group?.name === 'Quốc gia') {
                countries = await this.processEntities(group.list, this.regionRepo);
            } else {
                const groupCategories = await this.processEntities(group.list, this.categoryRepo);
                categories.push(...groupCategories);
            }
        }

        return { categories, countries };
    }

    private async processActors(casts: string) {
        const actorNames = (casts || '')
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean);
        return this.processEntities(actorNames, this.actorRepo);
    }

    private async processDirectors(directors: string) {
        const directorNames = (directors || '')
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean);
        return this.processEntities(directorNames, this.directorRepo);
    }

    private async processEntities(names: any[], repo: any) {
        const entities = await Promise.all(
            names.map(async (name) => {
                // Ensure name is a string and not empty
                if (typeof name !== 'string' || name.trim() === '') {
                    return null;
                }
                const slug = slugifyVietnamese(name.trim(), { lower: true });
                let entity = await repo.findOne({ filterQuery: { slug } });
                if (!entity) {
                    entity = await repo.create({
                        document: { name: name.trim(), slug },
                    });
                }
                return entity._id;
            }),
        );
        return entities.filter(Boolean);
    }

    private processEpisodes(newEpisodes: any[], existingEpisodes: Episode[] = []): Episode[] {
        const processedEpisodes: Episode[] = [...existingEpisodes];
        const existingServers = new Set(existingEpisodes.map((ep) => ep.serverName));
        let ncCounter = 1;

        (newEpisodes || []).forEach((episode) => {
            if (!episode || !episode.server_name) return;

            let serverName = episode.server_name;
            const serverData = (episode.items || [])
                .filter((item: any) => item && (item.embed || item.m3u8))
                .map((item: any, index): EpisodeServerData => {
                    let name = item?.name;
                    if (!name || !isNaN(Number(name))) {
                        name = `Tập ${index + 1 < 10 ? '0' : ''}${index + 1}`;
                    }
                    const slug = slugifyVietnamese(item?.name, { lower: true });
                    return {
                        name: name,
                        slug: slug,
                        filename: item.name || '',
                        linkEmbed: item.embed || '',
                        linkM3u8: item.m3u8 || '',
                    };
                });

            if (serverData.length === 0) return;

            // Check if the server name already exists
            if (existingServers.has(serverName)) {
                // Compare the host of m3u8 and embed links
                const existingEpisode = existingEpisodes.find((ep) => ep.serverName === serverName);
                if (existingEpisode) {
                    const existingHost = this.getHost(
                        existingEpisode.serverData[0]?.linkM3u8 ||
                            existingEpisode.serverData[0]?.linkEmbed,
                    );
                    const newHost = this.getHost(
                        serverData[0]?.linkM3u8 || serverData[0]?.linkEmbed,
                    );

                    if (existingHost !== newHost) {
                        // If hosts are different, create a new server name
                        serverName = `NC #${ncCounter++}`;
                    }
                }
            }

            processedEpisodes.push({
                serverName: serverName || `NC #${ncCounter++}`,
                serverData,
            });

            existingServers.add(serverName);
        });

        return processedEpisodes;
    }

    private getHost(url: string): string {
        try {
            const parsedUrl = parse(url);
            return parsedUrl.hostname || '';
        } catch {
            return '';
        }
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
}
