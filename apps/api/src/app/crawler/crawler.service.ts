import { Injectable, Logger } from '@nestjs/common';
import { CrawlerFactory } from './crawler.factory';
import { CrawlerQueueService } from './crawler-queue.service';
import { CrawlerType } from './dto/crawler-settings.schema';
import { BaseCrawler } from './base.crawler';
import { CrawlerSettingsService } from './crawler-settings.service';

/**
 * A unified service for crawler operations
 * This service provides a simplified interface for crawling that follows
 * a config-driven approach rather than instance-driven approach
 */
@Injectable()
export class CrawlerService {
    private readonly logger = new Logger(CrawlerService.name);

    constructor(
        private readonly crawlerFactory: CrawlerFactory,
        private readonly queueService: CrawlerQueueService,
        private readonly settingsService: CrawlerSettingsService,
    ) {}

    /**
     * Crawl a specific ID using the provided crawler type
     */
    async crawlSpecificId(type: CrawlerType, id: number, forceUpdate = false): Promise<boolean> {
        this.logger.log(`Initiating specific ID crawl for type: ${type}, id: ${id}`);
        const crawler = this.getCrawlerInstance(type);

        if (!crawler) {
            return false;
        }

        return crawler.crawlSpecificId(id, forceUpdate);
    }

    /**
     * Crawl a range of IDs using the provided crawler type
     */
    async crawlRange(
        type: CrawlerType,
        startId: number,
        endId: number,
        forceUpdate = false,
    ): Promise<boolean> {
        this.logger.log(`Initiating range crawl for type: ${type}, range: ${startId}-${endId}`);
        const crawler = this.getCrawlerInstance(type);

        if (!crawler) {
            return false;
        }

        return crawler.crawlRange(startId, endId, forceUpdate);
    }

    /**
     * Crawl latest content using the provided crawler type
     */
    async crawlLatest(type: CrawlerType, forceUpdate = false): Promise<boolean> {
        this.logger.log(`Initiating latest content crawl for type: ${type}`);
        const crawler = this.getCrawlerInstance(type);

        if (!crawler) {
            return false;
        }

        return crawler.crawlLatest(forceUpdate);
    }

    /**
     * Detect new movies using the provided crawler type
     */
    async detectNewMovies(type: CrawlerType): Promise<boolean> {
        this.logger.log(`Initiating new movie detection for type: ${type}`);
        const crawler = this.getCrawlerInstance(type);

        if (!crawler) {
            return false;
        }

        return crawler.detectNewMovies();
    }

    /**
     * Get a crawler instance by type with error handling
     */
    private getCrawlerInstance(type: CrawlerType): BaseCrawler | null {
        try {
            return this.crawlerFactory.getCrawlerByType(type);
        } catch (error) {
            this.logger.error(`Failed to get crawler instance for type ${type}: ${error.message}`);
            return null;
        }
    }

    /**
     * Execute a crawl operation based on crawler name and options
     * This is a higher-level method that can be used by controllers and resolvers
     */
    async executeCrawl(params: {
        name: string;
        specificId?: number;
        startId?: number;
        endId?: number;
        forceUpdate?: boolean;
        detectNew?: boolean;
    }): Promise<{ success: boolean; message: string }> {
        const { name, specificId, startId, endId, forceUpdate = false, detectNew = false } = params;

        try {
            // Get the crawler settings to determine the type
            const settings = await this.settingsService.getCrawlerSettingByName(name);

            if (!settings) {
                return {
                    success: false,
                    message: `No crawler configuration found with name: ${name}`,
                };
            }

            const { type } = settings;
            let success = false;
            let operation = '';

            // Determine which crawl operation to perform
            if (detectNew) {
                operation = 'detect new movies';
                success = await this.detectNewMovies(type);
            } else if (specificId !== undefined) {
                operation = `crawl specific ID: ${specificId}`;
                success = await this.crawlSpecificId(type, specificId, forceUpdate);
            } else if (startId !== undefined && endId !== undefined) {
                operation = `crawl ID range: ${startId}-${endId}`;
                success = await this.crawlRange(type, startId, endId, forceUpdate);
            } else {
                operation = 'crawl latest content';
                success = await this.crawlLatest(type, forceUpdate);
            }

            if (success) {
                return {
                    success: true,
                    message: `Successfully completed ${operation} for ${name}`,
                };
            } else {
                return {
                    success: false,
                    message: `Failed to ${operation} for ${name}`,
                };
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Error executing crawl for ${name}: ${message}`);
            return {
                success: false,
                message: `Error executing crawl: ${message}`,
            };
        }
    }
}
