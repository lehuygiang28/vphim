import { ConfigModule, ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

import { Movie, MovieSchema } from './movie.schema';
import { MovieRepository } from './movie.repository';
import { ActorModule } from '../actors/actor.module';
import { RedisModule, RedisService } from '../../libs/modules/redis';
import { CategoryModule } from '../categories';
import { DirectorModule } from '../directors';
import { RegionsModule } from '../regions';
import { MovieController } from './movies.controller';
import { MovieService } from './movie.service';
import { MovieResolver } from './movie.resolver';
import { ThrottlerCustomGuard } from '../../libs/guards/throttler.guard';
import { SearchService } from './search.service';
import { NguoncCrawler, KKPhimCrawler, OphimCrawler } from './crawler';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot(),
        ScheduleModule.forRoot(),
        ElasticsearchModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                node: configService.getOrThrow('ELASTIC_URL'),
                auth: {
                    username: 'elastic',
                    password: configService.getOrThrow('ELASTIC_PASSWORD'),
                },
            }),
        }),
        MongooseModule.forFeatureAsync([
            {
                name: Movie.name,
                useFactory: async () => {
                    const schema = MovieSchema;
                    return schema;
                },
            },
        ]),
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
                            ttl: configService.get('THROTTLE_TTL') || 1,
                            limit: configService.get('THROTTLE_LIMIT') || 1,
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
            useClass: ThrottlerCustomGuard,
        },
        SearchService,
        MovieResolver,
        MovieRepository,
        MovieService,
        OphimCrawler,
        KKPhimCrawler,
        NguoncCrawler,
        {
            provide: 'SEARCH_SERVICE',
            useFactory: (searchService: SearchService) => {
                global.searchService = searchService;
                return searchService;
            },
            inject: [SearchService],
        },
    ],
    exports: [MovieRepository, MovieService, SearchService, 'SEARCH_SERVICE'],
})
export class MovieModule {}
