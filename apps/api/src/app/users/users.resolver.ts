import { Logger } from '@nestjs/common';
import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UserType } from './user.type';
import { UsersService } from './users.service';
import { MutationMeInput } from './inputs/mutation-me.input';
import { RequiredRoles } from '../auth/guards/auth.guard';
import { CurrentUser, UserJwt } from '../auth';
import {
    MutationFollowMovieInput,
    MutationUnfollowMovieInput,
} from './inputs/mutation-follow-movie.input';

@Resolver(() => UserType)
export class UsersResolver {
    private readonly logger = new Logger(UsersResolver.name);
    constructor(private readonly usersService: UsersService) {}

    @RequiredRoles([], { isGql: true })
    @Mutation(() => UserType, { name: 'mutationMe' })
    updateMe(
        @Args('input') { fullName, avatar }: MutationMeInput,
        @CurrentUser() { userId }: UserJwt,
    ) {
        return this.usersService.update(userId, {
            fullName,
            ...(avatar?.url && { avatar: { url: avatar?.url } }),
        });
    }

    @RequiredRoles([], { isGql: true })
    @Query(() => UserType, { name: 'getMe' })
    getMe(@CurrentUser() { userId }: UserJwt) {
        return this.usersService.findByIdOrThrow(userId, {
            queryOptions: {
                populate: [
                    {
                        path: 'followMovies',
                        justOne: false,
                    },
                ],
            },
        });
    }

    @RequiredRoles([], { isGql: true })
    @Mutation(() => UserType, { name: 'followMovie' })
    followMovie(
        @Args('input') { movieSlug }: MutationFollowMovieInput,
        @CurrentUser() actor: UserJwt,
    ) {
        return this.usersService.followMovie({ actor, movieSlug });
    }

    @RequiredRoles([], { isGql: true })
    @Mutation(() => UserType, { name: 'unfollowMovie' })
    unfollowMovie(
        @Args('input') { movieSlug }: MutationUnfollowMovieInput,
        @CurrentUser() actor: UserJwt,
    ) {
        return this.usersService.unfollowMovie({ actor, movieSlug });
    }
}
