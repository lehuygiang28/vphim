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
import {
    convertToObjectId,
    isNullOrUndefined,
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
import { BaseCrawler, ICrawlerConfig, ICrawlerDependencies } from './base.crawler';

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

    protected shouldEnable(): boolean {
        // Only enable if KKPHIM_HOST is set or not set to 'false'
        const nguoncHost = this.configService.get<string>('NGUONC_HOST');
        return !!nguoncHost || nguoncHost === 'false';
    }

    protected async crawlMovies(): Promise<void> {
        this.logger.log('Crawling movie from Nguonc ...');
        await this.crawl();
    }

    protected async getNewestMovies(page: number): Promise<any> {
        const response = await this.httpService.axiosRef.get(
            `${this.config.host}/films/phim-moi-cap-nhat?page=${page}`,
        );
        return response.data;
    }

    protected async fetchAndSaveMovieDetail(slug: string, retryCount = 0): Promise<void> {
        try {
            const response = await this.httpService.axiosRef.get(
                `${this.config.host}/film/${slug}`,
            );
            const movieDetail = response.data.movie;
            if (movieDetail) {
                await this.saveMovieDetail(movieDetail);
            }
        } catch (error) {
            if (error.response && error.response.status === 429 && retryCount < 5) {
                const delay = this.calculateBackoff(retryCount);
                this.logger.warn(`Rate limited for slug ${slug}. Retrying in ${delay}ms...`);
                await sleep(delay);
                return this.fetchAndSaveMovieDetail(slug, retryCount + 1);
            }
            this.logger.error(`Error fetching movie detail for slug ${slug}: ${error}`);
            await this.addToFailedCrawls(slug);
        }
    }

    protected async saveMovieDetail(movieDetail: any): Promise<void> {
        const movieSlug = removeTone(removeDiacritics(movieDetail?.slug || ''));
        try {
            const existingMovie = await this.movieRepo.findOne({
                filterQuery: { slug: movieSlug },
            });
            const lastModified = new Date(movieDetail?.modified || Date.now());
            if (
                !this.config.forceUpdate &&
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
                type:
                    MOVIE_TYPE_MAP[this.processMovieType(movieDetail) || existingMovie?.type] ||
                    'N/A',
                time: convertToVietnameseTime(movieDetail?.time || existingMovie?.time),
                quality: mapQuality(movieDetail?.quality || existingMovie?.quality),
                lang: mapLanguage(movieDetail?.lang || existingMovie?.lang),
                status: mapStatus(existingMovie?.status || this.processMovieStatus(movieDetail)),
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
                await this.movieRepo.create({ document: movieData as Movie });
                this.logger.log(`Saved movie: "${movieSlug}"`);
            }
        } catch (error) {
            this.logger.error(`Error saving movie detail for ${movieSlug}: ${error}`);
        }
    }

    protected getTotalPages(response: any): number {
        return response.paginate.total_page;
    }

    protected getMovieItems(response: any): any[] {
        return response.items;
    }

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

    protected async processActors(casts: string): Promise<any[]> {
        const actorNames = (casts || '')
            .split(',')
            ?.map((name) => name?.toString()?.trim())
            .filter((actor) => !isNullOrUndefined(actor) && !!actor);
        return this.processEntities(actorNames || [], this.actorRepo);
    }

    protected async processDirectors(directors: string): Promise<any[]> {
        const directorNames = (directors || '')
            .split(',')
            ?.map((name) => name?.toString()?.trim())
            .filter((director) => !isNullOrUndefined(director) && !!director);
        return this.processEntities(directorNames || [], this.directorRepo);
    }

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

    protected async addToFailedCrawls(slug: string): Promise<void> {
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

    protected async retryFailedCrawls(): Promise<void> {
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

    protected calculateBackoff(retryCount: number): number {
        // Exponential backoff with jitter
        const baseDelay = 1000; // 1 second
        const maxDelay = 60000; // 1 minute
        const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
        const jitter = Math.random() * 1000; // Add up to 1 second of random jitter
        return exponentialDelay + jitter;
    }
}
