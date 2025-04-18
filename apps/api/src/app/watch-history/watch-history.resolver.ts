import { Logger } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';

import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryType, GetWatchHistoryOutput } from './watch-history.type';
import {
    SaveWatchHistoryInput,
    GetWatchHistoryInput,
    GetMovieWatchHistoryInput,
    DeleteWatchHistoryInput,
} from './inputs';
import { CurrentUser, RequiredRoles, UserJwt } from '../auth';

@SkipThrottle()
@Resolver(() => WatchHistoryType)
export class WatchHistoryResolver {
    private readonly logger = new Logger(WatchHistoryResolver.name);

    constructor(private readonly watchHistoryService: WatchHistoryService) {}

    @RequiredRoles([], { isGql: true })
    @Mutation(() => WatchHistoryType, { name: 'saveWatchHistory' })
    saveWatchHistory(
        @Args('input') input: SaveWatchHistoryInput,
        @CurrentUser() actor: UserJwt,
    ) {
        return this.watchHistoryService.saveWatchHistory({
            actor,
            ...input,
        });
    }

    @RequiredRoles([], { isGql: true })
    @Query(() => GetWatchHistoryOutput, { name: 'getWatchHistory' })
    getWatchHistory(
        @Args('input', { nullable: true }) input: GetWatchHistoryInput = {},
        @CurrentUser() actor: UserJwt,
    ) {
        return this.watchHistoryService.getUserWatchHistory({
            actor,
            limit: input.limit,
            offset: input.offset,
        });
    }

    @RequiredRoles([], { isGql: true })
    @Query(() => [WatchHistoryType], { name: 'getMovieWatchHistory' })
    getMovieWatchHistory(
        @Args('input') input: GetMovieWatchHistoryInput,
        @CurrentUser() actor: UserJwt,
    ) {
        return this.watchHistoryService.getMovieWatchHistory({
            actor,
            movieId: input.movieId,
        });
    }

    @RequiredRoles([], { isGql: true })
    @Mutation(() => Boolean, { name: 'deleteWatchHistory' })
    deleteWatchHistory(
        @Args('input') input: DeleteWatchHistoryInput,
        @CurrentUser() actor: UserJwt,
    ) {
        return this.watchHistoryService.deleteWatchHistory({
            actor,
            watchHistoryId: input.watchHistoryId,
        });
    }

    @RequiredRoles([], { isGql: true })
    @Mutation(() => Int, { name: 'clearAllWatchHistory' })
    clearAllWatchHistory(@CurrentUser() actor: UserJwt) {
        return this.watchHistoryService.clearAllWatchHistory({ actor });
    }
}
