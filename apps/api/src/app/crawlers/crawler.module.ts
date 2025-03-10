import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

import { RedisModule } from 'apps/api/src/libs/modules/redis';
import { TmdbModule } from 'apps/api/src/libs/modules/themoviedb.org/tmdb.module';

import { KKPhimCrawler, OphimCrawler } from './sources';
import { ActorModule } from '../actors';
import { CategoryModule } from '../categories';
import { DirectorModule } from '../directors';
import { RegionsModule } from '../regions';
import { CrawlController } from './crawler.controller';
@Module({
    imports: [
        ConfigModule.forRoot(),
        ScheduleModule.forRoot(),
        HttpModule,
        RedisModule,
        ActorModule,
        CategoryModule,
        DirectorModule,
        RegionsModule,
        TmdbModule,
    ],
    controllers: [CrawlController],
    providers: [OphimCrawler, KKPhimCrawler],
})
export class MovieCrawlerModule {}
