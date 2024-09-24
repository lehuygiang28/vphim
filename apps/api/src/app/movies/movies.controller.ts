import { Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Throttle } from '@nestjs/throttler';

import { MovieService } from './movie.service';
import { GetMoviesDto } from './dtos';
import { SearchService } from './search.service';

@ApiTags('movies')
@Controller({ path: 'movies' })
export class MovieController {
    constructor(
        private readonly movieService: MovieService,
        private readonly searchService: SearchService,
    ) {}

    @Throttle({ default: { limit: 100, ttl: 1000 * 60 * 5 } })
    @UseInterceptors(CacheInterceptor)
    @CacheTTL(60 * 60 * 3 * 1000)
    @Get('/')
    getMovies(@Query() dto: GetMoviesDto) {
        return this.movieService.getMoviesEs(dto);
    }

    @Throttle({ default: { limit: 1, ttl: 1000 * 60 * 5 } })
    @Post('/update-view/:slug')
    updateView(@Param('slug') slug: string) {
        return this.movieService.updateView(slug);
    }

    @Post('/soft-refresh')
    softRefresh() {
        return this.searchService.softRefresh();
    }
}
