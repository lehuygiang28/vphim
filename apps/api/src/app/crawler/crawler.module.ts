import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { BullModule } from '@nestjs/bullmq';

import { RedisModule } from 'apps/api/src/libs/modules/redis';
import { TmdbModule } from 'apps/api/src/libs/modules/themoviedb.org/tmdb.module';

// Crawlers
import { NguoncCrawler, KKPhimCrawler, OphimCrawler } from './index';
import { CrawlController } from './crawl.controller';

// Related modules
import { ActorModule } from '../actors';
import { CategoryModule } from '../categories';
import { DirectorModule } from '../directors';
import { RegionsModule } from '../regions';
import { MovieModule } from '../movies';
import { SearchService } from '../movies/search.service';

// Crawler settings
import { CrawlerSettings, CrawlerSettingsSchema } from './dto/crawler-settings.schema';
import { CrawlerSettingsRepository } from './dto/crawler-settings.repository';
import { CrawlerSettingsService } from './crawler-settings.service';
import { CrawlerSettingsResolver } from './crawler-settings.resolver';
import { isNullOrUndefined } from '../../libs/utils';
import { CrawlerProcessor } from './crawler.processor';
import { CrawlerScheduleProcessor } from './crawler.schedule-processor';

/**
 * Movie Crawler Module
 *
 * This module handles all movie crawling functionality:
 *
 * - Scheduled crawling of movie data from external sources
 * - Manual triggering of crawlers through API endpoints
 * - Storage and management of crawler configuration
 * - GraphQL API for crawler settings management
 *
 * The module contains:
 * 1. Crawler implementations for different sources (Ophim, KKPhim, Nguonc)
 * 2. Crawler settings management (repository, service, resolver)
 * 3. API endpoints for manual crawler control
 * 4. Integration with Redis for caching and MongoDB for storage
 */
@Module({
    imports: [
        // Core modules
        ConfigModule.forRoot(),

        // HTTP client with timeouts
        HttpModule.register({
            timeout: 60000, // 60 seconds
            maxRedirects: 5,
        }),

        // BullMQ for queues and scheduling
        BullModule.registerQueue({
            name: 'CRAWLER_CONFIG_QUEUE',
        }),
        BullModule.registerQueue({
            name: 'CRAWLER_SCHEDULE_QUEUE',
        }),

        // Cache
        RedisModule,

        // Related modules
        ActorModule,
        CategoryModule,
        DirectorModule,
        RegionsModule,
        TmdbModule,
        MovieModule,
        ElasticsearchModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const isElasticAuthEnabled = !isNullOrUndefined(
                    configService.get('ELASTIC_PASSWORD'),
                );
                return {
                    node: configService.getOrThrow('ELASTIC_URL'),
                    ...(isElasticAuthEnabled && {
                        auth: {
                            username: 'elastic',
                            password: configService.getOrThrow('ELASTIC_PASSWORD'),
                        },
                    }),
                };
            },
        }),

        // Database models
        MongooseModule.forFeature([{ name: CrawlerSettings.name, schema: CrawlerSettingsSchema }]),
    ],
    controllers: [CrawlController],
    providers: [
        // Crawler settings management (should come first since it's needed for other components)
        CrawlerSettingsRepository,
        CrawlerSettingsService,
        CrawlerSettingsResolver,

        // Crawler implementations
        OphimCrawler,
        KKPhimCrawler,
        NguoncCrawler,

        // BullMQ processors
        CrawlerProcessor,
        CrawlerScheduleProcessor,

        // Other services
        SearchService,
    ],
    exports: [
        // Crawlers
        OphimCrawler,
        KKPhimCrawler,
        NguoncCrawler,

        // Services and repositories
        CrawlerSettingsRepository,
        CrawlerSettingsService,
    ],
})
export class MovieCrawlerModule {}
