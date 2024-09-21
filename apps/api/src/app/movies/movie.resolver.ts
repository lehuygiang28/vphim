import { Resolver, Query, Args, Mutation, Int } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';

import { MovieType } from './movie.type';
import { MovieService } from './movie.service';
import { GetMoviesInput } from './inputs/get-movies.input';
import { GetMovieInput } from './inputs/get-movie.input';
import { GetMoviesOutput } from './outputs/get-movies.output';
import { UpdateMovieInput } from './inputs/mutate-movie.input';
import { MutateHardDeleteMovieInput } from './inputs/mutate-hard-delete-movie.input';

@SkipThrottle()
@Resolver(() => MovieType)
export class MovieResolver {
    constructor(private readonly movieService: MovieService) {}

    @Query(() => MovieType, { name: 'movie' })
    getMovie(@Args('input') input: GetMovieInput) {
        return this.movieService.getMovie(input);
    }

    @Query(() => GetMoviesOutput, { name: 'movies' })
    getMovies(@Args('input') input: GetMoviesInput) {
        return this.movieService.getMoviesEs(input);
    }

    @Mutation(() => MovieType, { name: 'updateMovie' })
    updateMovie(@Args('input') input: UpdateMovieInput) {
        return this.movieService.updateMovie(input);
    }

    @Mutation(() => Int, { name: 'mutateHardDeleteMovie' })
    hardDeleteMovie(@Args('input') input: MutateHardDeleteMovieInput) {
        return this.movieService.hardDeleteMovie(input);
    }
}
