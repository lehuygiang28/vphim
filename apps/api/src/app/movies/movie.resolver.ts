import { Resolver, Query, Args } from '@nestjs/graphql';
import { MovieType } from './movie.type';
import { MovieService } from './movie.service';
import { GetMoviesInput } from './inputs/get-movies.input';
import { GetMovieInput } from './inputs/get-movie.input';
import { GetMoviesOutput } from './outputs/get-movies.output';

@Resolver(() => MovieType)
export class MovieResolver {
    constructor(private readonly movieService: MovieService) {}

    @Query(() => MovieType, { name: 'movie' })
    getMovie(@Args('input') { slug }: GetMovieInput) {
        return this.movieService.getMovie(slug);
    }

    @Query(() => GetMoviesOutput, { name: 'movies' })
    getMovies(@Args('input') input: GetMoviesInput) {
        return this.movieService.getMovies(input);
    }
}
