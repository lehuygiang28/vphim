import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiExcludeController, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { KKPhimCrawler } from './kkphim.crawler';
import { OphimCrawler } from './ophim.crawler';
import { NguoncCrawler } from './nguonc.crawler';
import { ConfigService } from '@nestjs/config';
import { isNullOrUndefined, isTrue } from 'apps/api/src/libs/utils/common';
import { SearchService } from '../movies/search.service';
import { CrawlerSettingsService } from './dto/crawler-settings.service';
import { GetCrawlerSettingsOutput } from './dto/outputs/get-crawler-settings.output';

/**
 * Standard response format for crawler operations
 */
interface CrawlerResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Controller for triggering crawler operations
 * Provides API endpoints for manual crawler management
 */
@ApiTags('Crawler Operations')
@ApiExcludeController()
@Controller({ path: 'trigger-crawl' })
export class CrawlController {
    private pw: undefined | string;
    private readonly logger: Logger;

    constructor(
        private readonly kkphim: KKPhimCrawler,
        private readonly ophim: OphimCrawler,
        private readonly nguonc: NguoncCrawler,
        private readonly configService: ConfigService,
        private readonly searchService: SearchService,
        private readonly crawlerSettingsService: CrawlerSettingsService,
    ) {
        this.logger = new Logger(CrawlController.name);
        this.initializePassword();
    }

    /**
     * Initialize the password from configuration
     * @private
     */
    private initializePassword(): void {
        if (!isNullOrUndefined(this.configService.get<string>('CRAWLER_PW'))) {
            this.pw = this.configService.getOrThrow<string>('CRAWLER_PW');
            this.logger.log(`Crawler password is configured`);
        } else {
            this.logger.warn(
                'Crawler password is not configured. API endpoints will not be accessible.',
            );
        }
    }

    /**
     * Re-index all movies in search engine
     * @param pw Password for authentication
     * @param clear Whether to clear existing index before re-indexing
     */
    @ApiBody({
        schema: {
            properties: {
                pw: { type: 'string', description: 'Password for authentication' },
                clear: {
                    type: 'string',
                    description: 'Whether to clear existing index ("true" or "false")',
                },
            },
            required: ['pw'],
        },
    })
    @Post('/re-index')
    async reIndex(
        @Body() { pw, clear = 'false' }: { pw: string; clear?: string },
    ): Promise<CrawlerResponse<void>> {
        try {
            this.validatePassword(pw);

            this.logger.log(`Re-indexing movies in search service. Clear: ${clear}`);
            await this.searchService.indexAllMovies(isTrue(clear));

            return this.createSuccessResponse(
                `Re-indexing completed successfully. Clear: ${clear}`,
            );
        } catch (error) {
            return this.handleControllerError('Error during re-indexing', error);
        }
    }

    /**
     * Trigger a crawler with optional movie slug
     * @param crawler Name of the crawler to trigger
     * @param movieSlug Optional movie slug to crawl
     * @param pw Password for authentication
     */
    @ApiParam({
        name: 'crawler',
        description: 'The name of the crawler to trigger (e.g., ophim, kkphim, nguonc)',
    })
    @ApiQuery({
        name: 'movieSlug',
        required: false,
        description: 'Optional movie slug to crawl a specific movie',
    })
    @ApiBody({
        schema: {
            properties: {
                pw: { type: 'string', description: 'Password for authentication' },
            },
            required: ['pw'],
        },
    })
    @Post('/:crawler')
    async triggerCrawler(
        @Param('crawler') crawler: string,
        @Body() { pw }: { pw: string },
        @Query('movieSlug') movieSlug?: string,
    ): Promise<CrawlerResponse<void>> {
        try {
            this.validatePassword(pw);

            this.logger.log(
                `Triggering crawler ${crawler}${movieSlug ? ` for movie: ${movieSlug}` : ''}`,
            );

            await this.crawlerSettingsService.triggerCrawler({
                name: crawler,
                slug: movieSlug,
            });

            return this.createSuccessResponse(
                `Successfully triggered ${crawler} crawler${
                    movieSlug ? ` for movie: ${movieSlug}` : ''
                }`,
            );
        } catch (error) {
            return this.handleControllerError('Error triggering crawler', error);
        }
    }

    /**
     * Trigger a crawler for a specific movie
     * @param crawler Name of the crawler to trigger
     * @param movieSlug Slug of the movie to crawl
     * @param pw Password for authentication
     */
    @ApiParam({
        name: 'crawler',
        description: 'The name of the crawler to trigger (e.g., ophim, kkphim, nguonc)',
    })
    @ApiParam({
        name: 'movieSlug',
        description: 'The slug of the movie to crawl',
    })
    @ApiBody({
        schema: {
            properties: {
                pw: { type: 'string', description: 'Password for authentication' },
            },
            required: ['pw'],
        },
    })
    @Post('/:crawler/:movieSlug')
    async triggerCrawlerForMovie(
        @Param('crawler') crawler: string,
        @Param('movieSlug') movieSlug: string,
        @Body() { pw }: { pw: string },
    ): Promise<CrawlerResponse<void>> {
        try {
            this.validatePassword(pw);

            this.logger.log(`Triggering crawler ${crawler} for movie: ${movieSlug}`);

            await this.crawlerSettingsService.triggerCrawler({
                name: crawler,
                slug: movieSlug,
            });

            return this.createSuccessResponse(
                `Successfully triggered ${crawler} crawler for movie: ${movieSlug}`,
            );
        } catch (error) {
            return this.handleControllerError('Error triggering crawler for movie', error);
        }
    }

    /**
     * Get all crawler settings
     * @param pw Password for authentication
     */
    @ApiBody({
        schema: {
            properties: {
                pw: { type: 'string', description: 'Password for authentication' },
            },
            required: ['pw'],
        },
    })
    @Post('/settings')
    async getCrawlerSettings(
        @Body() { pw }: { pw: string },
    ): Promise<CrawlerResponse<GetCrawlerSettingsOutput>> {
        try {
            this.validatePassword(pw);

            const settings = await this.crawlerSettingsService.getCrawlerSettings({
                page: 1,
                limit: 100,
            });

            return this.createSuccessResponse(
                `Retrieved ${settings.data.length} crawler settings`,
                settings,
            );
        } catch (error) {
            return this.handleControllerError('Error getting crawler settings', error);
        }
    }

    /**
     * Validate password for authentication
     * @param pw Password to validate
     * @private
     */
    private validatePassword(pw: string): void {
        if (isNullOrUndefined(this.pw)) {
            throw new Error('Crawler password not configured');
        }

        if (pw !== this.pw) {
            throw new Error('Invalid password');
        }
    }

    /**
     * Create a standardized success response
     * @param message Success message
     * @param data Optional data to include
     * @private
     */
    private createSuccessResponse<T>(message: string, data?: T): CrawlerResponse<T> {
        return {
            success: true,
            message,
            ...(data ? { data } : {}),
        };
    }

    /**
     * Handle controller errors consistently
     * @param message Error context message
     * @param error Error object
     * @private
     */
    private handleControllerError(message: string, error: Error): CrawlerResponse<never> {
        this.logger.error(`${message}: ${error.message}`, error.stack);
        return {
            success: false,
            message: `${message}: ${error.message}`,
        };
    }
}
