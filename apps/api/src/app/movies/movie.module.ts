import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Movie, MovieSchema } from './movie.schema';
import { MovieRepository } from './movie.repository';
import { MovieCrawler } from './movie.crawler';
// import { CategoryService } from './movie.service';
// import { CategoryController } from './movie.controller';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        ScheduleModule.forRoot(),
    ],
    // controllers: [CategoryController],
    providers: [MovieRepository, MovieCrawler],
    exports: [MovieRepository],
})
export class MovieModule {}
