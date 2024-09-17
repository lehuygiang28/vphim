import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';

import { MovieType } from './movie.type';
import { MovieService } from './movie.service';
import { GetMoviesInput } from './inputs/get-movies.input';
import { GetMovieInput } from './inputs/get-movie.input';
import { GetMoviesOutput } from './outputs/get-movies.output';
import { GetRatingOutput } from './outputs/get-rating.output';
import { UpdateMovieInput } from './inputs/mutate-movie.input';

@SkipThrottle()
@Resolver(() => MovieType)
export class MovieResolver {
    constructor(private readonly movieService: MovieService) {}

    @Query(() => MovieType, { name: 'movie' })
    getMovie(@Args('input') { slug }: GetMovieInput) {
        return this.movieService.getMovie(slug);
    }

    @Query(() => GetRatingOutput, { name: 'getRating' })
    getRating(@Args('input') { slug }: GetMovieInput) {
        return this.movieService.getRating(slug);
    }

    @Query(() => GetMoviesOutput, { name: 'movies' })
    getMovies(@Args('input') input: GetMoviesInput) {
        return this.movieService.getMovies(input);
    }

    @Mutation(() => MovieType, { name: 'updateMovie' })
    updateMovie(@Args('input') input: UpdateMovieInput) {
        return this.movieService.updateMovie(input);
    }
}
