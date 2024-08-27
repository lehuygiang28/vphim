import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisStateService implements OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly logger: PinoLogger,
    ) {
        this.logger.setContext(RedisStateService.name);
    }

    async onModuleInit() {
        await this.checkRedisConnection();
    }

    async onModuleDestroy() {
        await this.redisClient.quit();
    }

    private async checkRedisConnection() {
        try {
            await this.redisClient.ping();
            this.logger.debug(`[${'REDIS_CLIENT'}] Redis client connected`);
        } catch (error) {
            this.logger.error(`[${'REDIS_CLIENT'}] Unable to connect to Redis`, error);
        }
    }
}
