import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Movie, MovieSchema } from './movie.schema';
import { MovieRepository } from './movie.repository';
import { ActorModule } from '../actors/actor.module';
import { RedisModule } from '../../libs/modules/redis';
import { CategoryModule } from '../categories';
import { DirectorModule } from '../directors';
import { RegionsModule } from '../regions';
import { MovieController } from './movies.controller';
import { MovieService } from './movie.service';
import { MovieCrawler } from './movie.crawler';
import { KKPhimCrawler } from './kkphim.crawler';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        ScheduleModule.forRoot(),
        RedisModule,
        ActorModule,
        CategoryModule,
        DirectorModule,
        RegionsModule,
    ],
    controllers: [MovieController],
    providers: [MovieRepository, MovieService, MovieCrawler, KKPhimCrawler],
    exports: [MovieRepository],
})
export class MovieModule {}
