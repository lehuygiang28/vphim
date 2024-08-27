import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { RedisService } from './services';

@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new Redis({
                    name: config.get<string>('REDIS_NAME') || 'tasktr_redis_default',
                    host: config.getOrThrow<string>('REDIS_HOST'),
                    port: config.getOrThrow<number>('REDIS_PORT'),
                    username: config.get<string>('REDIS_USER') || undefined,
                    password: config.getOrThrow<string>('REDIS_PASSWORD'),
                    connectTimeout: Number(config.get<number>('REDIS_CONNECT_TIMEOUT')) || 20000,
                    keepAlive: Number(config.get<number>('REDIS_KEEP_ALIVE')) || 10000, // Send a PING every 10 seconds
                    maxRetriesPerRequest: null,
                    reconnectOnError: () => {
                        const reconnectAndResendFailedCmd = 2;
                        return reconnectAndResendFailedCmd;
                    },
                } as RedisOptions);
            },
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
