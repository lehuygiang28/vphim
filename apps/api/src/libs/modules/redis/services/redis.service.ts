import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(
        @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
        private readonly logger: PinoLogger,
    ) {}

    private async cleanConnection() {
        this.logger.info('Redis service is cleaning connection...');
        return this.redisClient.quit();
    }

    async onModuleDestroy() {
        this.logger.info('Redis service is destroying...');
        await this.cleanConnection();
    }

    public get getClient(): Redis {
        return this.redisClient;
    }

    public async get<T = string>(key: string): Promise<T | null> {
        const isUse = await this.redisClient.get('IS_USE_CACHE');
        if (isUse != null && isUse != undefined && isUse === 'false' && key.startsWith('CACHE')) {
            return null;
        }
        const value = await this.redisClient.get(key);
        try {
            const res = value ? (JSON.parse(value) as T) : null;
            return res;
        } catch (error) {
            return value as T;
        }
    }

    /**
     * @param key key of redis to set
     * @param value value of redis to set
     * @param ttl time to live of redis to set (in milliseconds)
     * @returns ok if success
     */
    public async set(
        key: string,
        value: object | string | boolean | number,
        ttl?: number,
    ): Promise<'OK'> {
        const valueString = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
        if (ttl) {
            return this.redisClient.set(key, valueString, 'PX', ttl);
        } else return this.redisClient.set(key, valueString);
    }

    public async del(key: string): Promise<number> {
        return this.redisClient.del(key);
    }

    public async incr(key: string): Promise<number> {
        return this.redisClient.incr(key);
    }

    public async decr(key: string): Promise<number> {
        return this.redisClient.decr(key);
    }

    public async setExpire(key: string, seconds: number): Promise<number> {
        return this.redisClient.expire(key, seconds);
    }

    public async getTtl(key: string): Promise<number> {
        return this.redisClient.ttl(key);
    }

    public async delWithPrefix(prefix: string): Promise<number> {
        const keys = await this.redisClient.keys(prefix);
        if (!keys || keys?.length <= 0) {
            return 0;
        }
        return this.redisClient.del(...keys);
    }

    /**
     * Alias for delWithPrefix to maintain backward compatibility
     * @param pattern Pattern to match keys to delete
     * @returns Number of keys deleted
     */
    public async clearByPattern(pattern: string): Promise<number> {
        return this.delWithPrefix(pattern);
    }

    public async keys(pattern: string): Promise<string[]> {
        return this.redisClient.keys(pattern);
    }

    public async exists(key: string): Promise<boolean> {
        return (await this.redisClient.exists(key)) > 0;
    }

    public async existsUniqueKey(key: string): Promise<boolean> {
        return (await this.redisClient.exists(key)) === 1;
    }
}
