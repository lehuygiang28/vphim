import {
    Controller,
    Get,
    Query,
    Res,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { Logger } from '@nestjs/common';
import { RedisService } from '../libs/modules/redis';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Controller({ path: '/' })
export class AppController {
    private readonly logger = new Logger(AppController.name);
    constructor(
        private readonly appService: AppService,
        private readonly redisService: RedisService,
        private readonly elasticsearchService: ElasticsearchService,
        @InjectConnection() private readonly mongoConnection: Connection,
    ) {}

    @Get('/ping')
    async getPing() {
        return 'pong';
    }

    @Get('/health')
    async getHealth(@Res({ passthrough: true }) res: Response) {
        const withTimeout = async <T>(p: Promise<T>, ms: number, label: string): Promise<T> => {
            let timeoutId: NodeJS.Timeout | undefined;
            const timeout = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error(`${label}_timeout`)), ms);
            });
            try {
                return await Promise.race([p, timeout]);
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
            }
        };

        const startedAt = Date.now();

        const [redis, elastic, mongo] = await Promise.allSettled([
            withTimeout(this.redisService.getClient.ping(), 5000, 'redis_ping'),
            withTimeout(this.elasticsearchService.ping(), 5000, 'elastic_ping'),
            withTimeout(
                this.mongoConnection?.db?.admin()?.ping?.() ?? Promise.resolve(null),
                5000,
                'mongo_ping',
            ),
        ]);

        const redisOk = redis.status === 'fulfilled';
        const elasticOk = elastic.status === 'fulfilled';
        const mongoOk = mongo.status === 'fulfilled';

        const ok = redisOk && elasticOk && mongoOk;
        res.status(ok ? 200 : 503);

        return {
            ok,
            uptimeMs: Math.max(0, Math.round(process.uptime() * 1000)),
            latencyMs: Date.now() - startedAt,
            services: {
                api: { ok: true },
                redis: redisOk
                    ? { ok: true, result: redis.value }
                    : {
                          ok: false,
                          error: (redis.reason as Error)?.message ?? String(redis.reason),
                      },
                elasticsearch: elasticOk
                    ? { ok: true, result: elastic.value }
                    : {
                          ok: false,
                          error: (elastic.reason as Error)?.message ?? String(elastic.reason),
                      },
                mongodb: mongoOk
                    ? { ok: true, result: mongo.value }
                    : {
                          ok: false,
                          error: (mongo.reason as Error)?.message ?? String(mongo.reason),
                      },
            },
        };
    }

    /**
     * GET endpoint to process an m3u8 file.
     * Query Parameters:
     *  - p: provider ('o' or 'k')
     *  - u: URL of the m3u8 playlist
     *  - i: (Optional) discontinuity marker(s) to remove
     *       Can be a single number (e.g., "16") or comma-separated numbers (e.g., "16,17")
     */
    @Get('p3')
    async processM3u8(
        @Query('p') provider: string,
        @Query('u') m3u8Url: string,
        @Query('i') removalIndices: string, // can be single value "16" or multiple "16,17"
        @Res() res: Response,
    ) {
        // Validate inputs
        if (!m3u8Url) {
            throw new BadRequestException('Missing m3u8 URL');
        }

        if (provider !== 'o' && provider !== 'k') {
            throw new BadRequestException('Invalid provider');
        }

        // Parse removalIndices to either a number, array of numbers, or undefined
        let indices: number | number[] | undefined = undefined;

        if (removalIndices) {
            if (removalIndices.includes(',')) {
                // Parse comma-separated values efficiently
                try {
                    indices = removalIndices.split(',').map((index) => {
                        const parsed = parseInt(index.trim(), 10);
                        if (isNaN(parsed)) throw new Error('Invalid index');
                        return parsed;
                    });
                } catch (error) {
                    // If parsing fails, leave indices as undefined to use default
                    indices = undefined;
                }
            } else {
                // Single value
                const parsed = parseInt(removalIndices, 10);
                indices = isNaN(parsed) ? undefined : parsed;
            }
        }

        try {
            // Process the m3u8 file via AppService with timeout and retry
            const processedContent = await this.appService.processM3U8(
                provider as 'o' | 'k',
                m3u8Url,
                indices,
            );

            // Set response headers for optimal delivery
            this.setM3u8ResponseHeaders(res);

            return res.send(processedContent);
        } catch (error) {
            this.logger.error(`Error processing M3U8: ${error.message || 'Unknown error'}`);
            throw new InternalServerErrorException('Failed to process M3U8');
        }
    }

    /**
     * Sets common response headers for M3U8 responses
     */
    private setM3u8ResponseHeaders(res: Response): void {
        // Set the MIME type to HLS playlist type
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        // Cache for 30 days (2592000 seconds)
        res.setHeader('Cache-Control', 'public, max-age=2592000');
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Add ETag for better caching
        res.setHeader('ETag', Math.random().toString(36).substring(2, 15));
    }
}
