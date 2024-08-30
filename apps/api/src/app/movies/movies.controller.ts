import { Controller, Get, Query } from '@nestjs/common';
import { MovieService } from './movie.service';
import { GetMoviesDto } from './dtos';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('movies')
@Controller({ path: 'movies' })
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    @Get('/')
    getMovies(@Query() dto: GetMoviesDto) {
        return this.movieService.getMovies(dto);
    }
}
