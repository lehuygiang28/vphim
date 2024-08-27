import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RedisModule, RedisService } from '../libs/modules/redis';
import { PinoModule } from '../libs/modules/pino';
import { MongodbModule } from '../libs/modules/mongodb';
import { AuthModule } from './auth';
import { UsersModule } from './users';
import appConfig from './config/app-config';
import { RegionsModule } from './regions';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig],
        }),
        PinoModule,
        MongodbModule,
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
        RegionsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
