import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

import { MovieService } from './movie.service';
import { GetMoviesDto } from './dtos';

@ApiTags('movies')
@Controller({ path: 'movies' })
export class MovieController {
    constructor(private readonly movieService: MovieService) {}

    @UseInterceptors(CacheInterceptor)
    @CacheTTL(60 * 60 * 3 * 1000)
    @Get('/')
    getMovies(@Query() dto: GetMoviesDto) {
        return this.movieService.getMovies(dto);
    }
}
