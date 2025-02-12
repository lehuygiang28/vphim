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

    constructor(protected readonly dependencies: ICrawlerDependencies) {
        this.config = dependencies.config;
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
            cron: this.config.cronSchedule,
            tz: process.env.TZ,
            tzOffset: new Date().getTimezoneOffset(),
        });
    }

    onModuleInit() {
        const crawMovieJob = new CronJob(this.config.cronSchedule, this.crawlMovies.bind(this));
        this.schedulerRegistry.addCronJob(
            `${this.crawlMovies.name}_${this.config.name}`,
            crawMovieJob,
        );
        crawMovieJob.start();
    }

    onModuleDestroy() {
        this.schedulerRegistry.deleteCronJob(`${this.crawlMovies.name}_${this.config.name}`);
    }

    protected abstract crawlMovies(): Promise<void>;
    protected abstract getNewestMovies(page: number): Promise<any>;
    protected abstract fetchAndSaveMovieDetail(slug: string, retryCount?: number): Promise<void>;
    protected abstract saveMovieDetail(movieDetail: any): Promise<void>;
    protected abstract getTotalPages(response: any): number;
    protected abstract getMovieItems(response: any): any[];

    public async triggerCrawl() {
        return this.crawl();
    }

    protected async crawl() {
        const today = new Date().toISOString().slice(0, 10);
        const crawlKey = `crawled-pages:${this.config.host}:${today}`;

        try {
            const latestMovies = await this.getNewestMovies(1);
            const totalPages = this.getTotalPages(latestMovies);

            let lastCrawledPage = 0;
            try {
                lastCrawledPage = parseInt(await this.redisService.get(crawlKey)) || 0;
            } catch (error) {
                this.logger.error(`Error getting last crawled page from Redis: ${error}`);
            }

            for (let i = lastCrawledPage; i <= totalPages; i++) {
                await this.crawlPage(i);
                await this.redisService.set(crawlKey, i, 60 * 60 * 24 * 1000);

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

            if (this.moviesToRevalidate.length > 0) {
                await this.revalidateMovies();
            }
        } catch (error) {
            this.logger.error(`Error crawling movies: ${error}`);
        }
    }

    protected async crawlPage(page: number) {
        try {
            const movies = await this.getNewestMovies(page);
            const items = this.getMovieItems(movies);
            for (const movie of items) {
                if (movie?.slug) {
                    await this.fetchAndSaveMovieDetail(movie.slug);
                }
            }
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
