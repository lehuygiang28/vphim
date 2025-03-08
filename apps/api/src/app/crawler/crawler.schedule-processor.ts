import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { OphimCrawler, KKPhimCrawler, NguoncCrawler } from './index';
import { CrawlerJobName, ScheduledCrawlJobData } from './types/crawler-jobs.types';
import { CrawlerSettingsRepository } from './dto/crawler-settings.repository';
import { CrawlerType } from './dto/crawler-settings.schema';

/**
 * BullMQ processor for scheduled crawler jobs
 * Handles execution of scheduled crawling tasks
 */
@Processor('CRAWLER_SCHEDULE_QUEUE')
@Injectable()
export class CrawlerScheduleProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(CrawlerScheduleProcessor.name);

    constructor(
        private readonly ophimCrawler: OphimCrawler,
        private readonly kkphimCrawler: KKPhimCrawler,
        private readonly nguoncCrawler: NguoncCrawler,
        private readonly crawlerSettingsRepo: CrawlerSettingsRepository,
        @InjectQueue('CRAWLER_SCHEDULE_QUEUE')
        private readonly scheduleQueue: Queue<ScheduledCrawlJobData, unknown, CrawlerJobName>,
    ) {
        super();
    }

    onModuleInit() {
        this.logger.log(
            `🚀 ${CrawlerScheduleProcessor.name} for CRAWLER_SCHEDULE_QUEUE is initialized and ready.`,
        );
    }

    /**
     * Process scheduled crawler jobs
     */
    async process(job: Job<ScheduledCrawlJobData, unknown, CrawlerJobName>): Promise<boolean> {
        if (job.name !== 'scheduledCrawl') {
            this.logger.warn(`⚠️ Unexpected job type in schedule queue: ${job.name}`);
            return false;
        }

        const { name } = job.data;
        const timestamp = new Date().toISOString();
        this.logger.log(
            `⏰ Executing scheduled crawl for: ${name} (job ${job.id}, started at ${timestamp})`,
        );

        // Get and log schedule information
        try {
            // Get information about the repeatable job schedule
            const jobKey = `schedule:${name}`;
            const repeatableJobs = await this.scheduleQueue.getRepeatableJobs();
            const thisJob = repeatableJobs.find(
                (j) => j.id === jobKey && j.name === 'scheduledCrawl',
            );

            if (thisJob) {
                this.logger.log(
                    `📅 Next execution scheduled for: ${new Date(thisJob.next).toLocaleString()}`,
                );
                this.logger.log(`🔄 Cron pattern: ${thisJob.pattern}`);
            }
        } catch (error) {
            // Non-critical error, just log it
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`⚠️ Couldn't determine schedule information: ${errorMessage}`);
        }

        const crawler = await this.getCrawlerByName(name);
        if (!crawler) {
            this.logger.warn(`🔍 No crawler found with name: ${name}`);
            return false;
        }

        try {
            this.logger.log(`▶️ Starting crawler execution for: ${name}`);
            await crawler.triggerCrawl();
            this.logger.log(`✅ Successfully completed scheduled crawl for: ${name}`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Failed scheduled crawl for ${name}: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Get a crawler instance by name
     * Uses the crawler type from database configuration
     */
    private async getCrawlerByName(
        name: string,
    ): Promise<OphimCrawler | KKPhimCrawler | NguoncCrawler | null> {
        try {
            // First, get the crawler configuration from database
            const config = await this.crawlerSettingsRepo.findOne({
                filterQuery: { name },
            });

            if (!config) {
                this.logger.warn(`⚠️ No configuration found for crawler: ${name}`);
                return null;
            }

            // Use the type field to determine which crawler implementation to use
            switch (config.type) {
                case CrawlerType.OPHIM:
                    return this.ophimCrawler;
                case CrawlerType.KKPHIM:
                    return this.kkphimCrawler;
                case CrawlerType.NGUONC:
                    return this.nguoncCrawler;
                default:
                    this.logger.warn(
                        `⚠️ Unknown crawler type: ${config.type} for crawler: ${name}`,
                    );
                    return null;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Error getting crawler instance for ${name}: ${errorMessage}`);
            return null;
        }
    }
}
