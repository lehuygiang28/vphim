import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';

import { Movie, MovieSchema } from './movie.schema';
import { MovieRepository } from './movie.repository';
import { ActorModule } from '../actors/actor.module';
import { RedisModule, RedisService } from '../../libs/modules/redis';
import { CategoryModule } from '../categories';
import { DirectorModule } from '../directors';
import { RegionsModule } from '../regions';
import { MovieController } from './movies.controller';
import { MovieService } from './movie.service';
import { MovieCrawler } from './movie.crawler';
import { KKPhimCrawler } from './kkphim.crawler';
import { MovieResolver } from './movie.resolver';

@Module({
    imports: [
        ConfigModule.forRoot(),
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        ScheduleModule.forRoot(),
        HttpModule,
        RedisModule,
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => {
                const redisUser = configService.get('REDIS_USER') ?? '';
                const redisPassword = configService.get('REDIS_PASSWORD') ?? '';
                const redisHost = configService.getOrThrow('REDIS_HOST');
                const redisPort = configService.get('REDIS_PORT') ?? '';
                const redisScheme = configService.get('REDIS_SCHEME') ?? 'redis';

                const credentials = redisPassword ? `${redisUser ?? ''}:${redisPassword}@` : '';
                const url = `${redisScheme}://${credentials}${redisHost}${
                    redisPort ? `:${redisPort}` : ''
                }`;

                return {
                    store: redisStore,
                    url,
                };
            },
            inject: [ConfigService],
        }),
        ActorModule,
        CategoryModule,
        DirectorModule,
        RegionsModule,
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule, RedisModule],
            inject: [ConfigService, RedisService],
            useFactory: (configService: ConfigService, redisService: RedisService) => {
                return {
                    throttlers: [
                        {
                            name: 'default',
                            ttl: configService.get('THROTTLE_TTL') || 1000 * 60,
                            limit: configService.get('THROTTLE_LIMIT') || 10,
                        },
                    ],
                    storage: new ThrottlerStorageRedisService(redisService.getClient),
                };
            },
        }),
    ],
    controllers: [MovieController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        MovieResolver,
        MovieRepository,
        MovieService,
        MovieCrawler,
        KKPhimCrawler,
    ],
    exports: [MovieRepository, MovieService],
})
export class MovieModule {}
