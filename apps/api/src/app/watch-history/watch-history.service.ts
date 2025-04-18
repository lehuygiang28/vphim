import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import { convertToObjectId } from '../../libs/utils';

import { WatchHistoryRepository } from './watch-history.repository';
import { WatchHistory } from './schemas';
import { UsersService } from '../users/users.service';
import { MovieService } from '../movies/movie.service';
import { UserJwt } from '../auth';
import { SaveWatchHistoryInput } from './inputs';

@Injectable()
export class WatchHistoryService {
    private readonly logger = new Logger(WatchHistoryService.name);

    constructor(
        private readonly watchHistoryRepository: WatchHistoryRepository,
        private readonly usersService: UsersService,
        private readonly movieService: MovieService,
    ) {}

    async saveWatchHistory({
        actor,
        movieId,
        episodeName,
        serverName,
        serverSlug,
        progress,
    }: {
        actor: UserJwt;
    } & SaveWatchHistoryInput): Promise<WatchHistory> {
        const user = await this.usersService.findByIdOrThrow(actor.userId);
        const movie = await this.movieService.getMovie({ _id: movieId }, { populate: false });

        if (!movie) {
            this.logger.warn(`Movie with ID ${movieId} not found`);
            throw new Error('Movie not found');
        }

        const filterQuery = {
            userId: user._id,
            movieId: convertToObjectId(movieId),
            episodeName,
            serverName,
            serverSlug,
        };

        const existingRecord = await this.watchHistoryRepository.findOne({
            filterQuery,
        });

        if (existingRecord) {
            return this.watchHistoryRepository.findOneAndUpdate({
                filterQuery,
                updateQuery: {
                    progress,
                    lastWatched: new Date(),
                },
                queryOptions: {
                    populate: [{ path: 'movieId', justOne: true }],
                },
            });
        }

        await this.watchHistoryRepository.create({
            document: {
                userId: user._id,
                movieId: convertToObjectId(movieId),
                episodeName,
                serverName,
                serverSlug,
                progress: {
                    ...progress,
                    completed: progress?.completed ?? false,
                },
                lastWatched: new Date(),
            },
        });

        return this.watchHistoryRepository.findOne({
            filterQuery,
            queryOptions: {
                populate: [{ path: 'movieId', justOne: true }],
            },
        });
    }

    async getUserWatchHistory({
        actor,
        limit = 10,
        offset = 0,
    }: {
        actor: UserJwt;
        limit?: number;
        offset?: number;
    }): Promise<{ data: WatchHistory[]; total: number }> {
        const user = await this.usersService.findByIdOrThrow(actor.userId);
        const filterQuery: FilterQuery<WatchHistory> = {
            userId: user._id,
        };

        const [data, total] = await Promise.all([
            this.watchHistoryRepository.find({
                filterQuery,
                queryOptions: {
                    sort: { lastWatched: -1 },
                    limit,
                    skip: offset,
                    populate: [{ path: 'movieId', justOne: true }],
                },
            }),
            this.watchHistoryRepository.count(filterQuery),
        ]);

        return { data, total };
    }

    async getMovieWatchHistory({
        actor,
        movieId,
    }: {
        actor: UserJwt;
        movieId: string;
    }): Promise<WatchHistory[]> {
        const user = await this.usersService.findByIdOrThrow(actor.userId);

        return this.watchHistoryRepository.find({
            filterQuery: {
                userId: user._id,
                movieId: convertToObjectId(movieId),
            },
            queryOptions: {
                sort: { lastWatched: -1 },
            },
        });
    }

    async deleteWatchHistory({
        actor,
        watchHistoryId,
    }: {
        actor: UserJwt;
        watchHistoryId: string;
    }): Promise<boolean> {
        const result = await this.watchHistoryRepository.findOneOrThrow({
            filterQuery: {
                _id: convertToObjectId(watchHistoryId),
                userId: convertToObjectId(actor.userId),
            },
        });

        return (
            await this.watchHistoryRepository.deleteOne({
                _id: convertToObjectId(result._id),
            })
        ).acknowledged;
    }

    async clearAllWatchHistory({ actor }: { actor: UserJwt }): Promise<number> {
        const result = await this.watchHistoryRepository.deleteMany({
            userId: convertToObjectId(actor.userId),
        });

        return result.deletedCount;
    }
}
