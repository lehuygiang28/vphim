import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import appConfig from './config/app-config';
import { RedisModule, RedisService } from '../libs/modules/redis';
import { MongodbModule } from '../libs/modules/mongodb';
import { PinoModule } from '../libs/modules/pino';
import { ActorModule } from './actors';
import { AuthModule } from './auth';
import { CategoryModule } from './categories';
import { DirectorModule } from './directors';
import { MovieModule } from './movies';
import { RegionsModule } from './regions';
import { UsersModule } from './users';
import { ImagesModule } from './images';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        PinoModule,
        MongodbModule,
        RedisModule,
        GraphQLModule.forRootAsync<ApolloDriverConfig>({
            driver: ApolloDriver,
            useFactory: async () => {
                return {
                    autoSchemaFile: './schema.gql',
                    playground: true,
                    csrfPrevention: false,
                    context: ({ req, res }) => ({ req, res }),
                };
            },
        }),
        AuthModule,
        UsersModule,
        BullModule.forRootAsync({
            imports: [RedisModule],
            useFactory: async (redisService: RedisService) => ({
                connection: redisService.getClient,
                streams: {
                    events: {
                        maxLen: 100,
                    },
                },
            }),
            inject: [RedisService],
        }),
        ImagesModule,
        RegionsModule,
        CategoryModule,
        MovieModule,
        ActorModule,
        DirectorModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
