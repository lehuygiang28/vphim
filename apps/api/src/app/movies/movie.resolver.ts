import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';

import { MovieType } from './movie.type';
import { MovieService } from './movie.service';
import { GetMoviesInput } from './inputs/get-movies.input';
import { GetMovieInput } from './inputs/get-movie.input';
import { GetMoviesOutput } from './outputs/get-movies.output';
import { UpdateMovieInput } from './inputs/mutate-movie.input';
import { MutateHardDeleteMovieInput } from './inputs/mutate-hard-delete-movie.input';
import { CreateMovieInput } from './inputs/create-movie.input';
import { UserRoleEnum } from '../users';
import { RequiredRoles } from '../auth';
import { GetMoviesAdminInput } from './inputs/get-movies-admin.input';

@SkipThrottle()
@Resolver(() => MovieType)
export class MovieResolver {
    constructor(private readonly movieService: MovieService) {}

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => MovieType, { name: 'createMovie' })
    async createMovie(@Args('input') input: CreateMovieInput): Promise<MovieType> {
        return this.movieService.createMovie(input);
    }

    @Query(() => MovieType, { name: 'movie' })
    getMovie(@Args('input') input: GetMovieInput) {
        return this.movieService.getMovie(input);
    }

    @Query(() => GetMoviesOutput, { name: 'movies' })
    getMovies(@Args('input') input: GetMoviesInput) {
        return this.movieService.getMoviesEs(input);
    }

    @Query(() => GetMoviesOutput, { name: 'moviesForAdmin' })
    getMoviesAdmin(@Args('input') input: GetMoviesAdminInput) {
        return this.movieService.getMoviesEs(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => MovieType, { name: 'updateMovie' })
    updateMovie(@Args('input') input: UpdateMovieInput) {
        return this.movieService.updateMovie(input);
    }

    @RequiredRoles('admin' as UserRoleEnum, { isGql: true })
    @Mutation(() => Int, { name: 'mutateHardDeleteMovie' })
    hardDeleteMovie(@Args('input') input: MutateHardDeleteMovieInput) {
        return this.movieService.hardDeleteMovie(input);
    }
}
