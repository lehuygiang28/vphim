import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { CronJob } from 'cron';
import { Ophim, MovieInNewest, Movie as OPhimMovie } from 'ophim-js';

import { Movie } from './movie.schema';
import { MovieRepository } from './movie.repository';
import { isNullOrUndefined } from '../../libs/utils/common';

@Injectable()
export class MovieCrawler implements OnModuleInit, OnModuleDestroy {
    private readonly MOVIE_CRON: string = '0 2 * * *';
    private readonly logger = new Logger(MovieCrawler.name);
    private readonly ophim: Ophim;

    constructor(
        private readonly movieRepo: MovieRepository,
        private readonly configService: ConfigService,
        private readonly schedulerRegistry: SchedulerRegistry,
    ) {
        if (!isNullOrUndefined(this.configService.get('MOVIE_CRON'))) {
            this.MOVIE_CRON = this.configService.getOrThrow<string>('MOVIE_CRON');
        }

        this.ophim = new Ophim({
            host: configService.get('OPHIM_HOST'),
        });
    }

    onModuleInit() {
        const crawMovieJob = new CronJob(this.MOVIE_CRON, this.crawMovie.bind(this));
        this.schedulerRegistry.addCronJob(this.crawMovie.name, crawMovieJob);
        crawMovieJob.start();
        return this.crawl();
    }

    onModuleDestroy() {
        this.schedulerRegistry.deleteCronJob(this.crawMovie.name);
    }

    async crawMovie() {
        this.logger.log('Crawling movie ...');
        return this.crawl();
    }

    async crawl() {
        const newest = await this.ophim.getNewestMovies({ page: 1 });

        const newestMovies = newest.items?.map((movie: MovieInNewest) => ({
            slug: movie.slug,
            modifiedAt: new Date(movie.modified?.['time']),
        }));
    }
}
