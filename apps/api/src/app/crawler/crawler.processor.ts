import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';

import { OphimCrawler, KKPhimCrawler, NguoncCrawler } from './index';
import {
    CrawlerJobName,
    UpdateCrawlerConfigJobData,
    TriggerCrawlJobData,
    ScheduledCrawlJobData,
    CronRepeatOptions,
} from './types/crawler-jobs.types';
import { CrawlerSettingsRepository } from './dto/crawler-settings.repository';
import { CrawlerType } from './dto/crawler-settings.schema';

/**
 * BullMQ processor for crawler-related jobs
 * Handles configuration updates and triggered crawls through a queue
 */
@Processor('CRAWLER_CONFIG_QUEUE')
@Injectable()
export class CrawlerProcessor extends WorkerHost implements OnModuleInit {
    private readonly logger = new Logger(CrawlerProcessor.name);

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

    async onModuleInit() {
        this.logger.log(
            `🚀 ${CrawlerProcessor.name} for CRAWLER_CONFIG_QUEUE is initialized and ready.`,
        );

        // Initialize crawler schedules from database configurations
        await this.initializeCrawlerSchedules();
    }

    /**
     * Initialize crawler schedules from database configurations
     * This ensures all enabled crawlers have their schedules set up when the app starts
     */
    private async initializeCrawlerSchedules(): Promise<void> {
        try {
            this.logger.log(`🔄 Initializing crawler schedules from database configurations...`);

            // Get all existing repeatable jobs
            const existingJobs = await this.scheduleQueue.getRepeatableJobs();
            this.logger.log(`📋 Found ${existingJobs.length} existing scheduled jobs`);

            // Get all crawler configurations from database
            const crawlerConfigs = await this.crawlerSettingsRepo.find({
                filterQuery: {},
                queryOptions: { limit: 100 },
            });

            this.logger.log(`📋 Found ${crawlerConfigs.length} crawler configurations in database`);

            for (const config of crawlerConfigs) {
                const jobKey = `schedule:${config.name}`;

                // Check if this crawler already has a scheduled job
                const existingJob = existingJobs.find(
                    (job) => job.name === 'scheduledCrawl' && job.id === jobKey,
                );

                if (config.enabled && config.cronSchedule) {
                    if (existingJob) {
                        // Check if the schedule has changed
                        if (existingJob.pattern !== config.cronSchedule) {
                            this.logger.log(
                                `🔄 Schedule changed for ${config.name}: ${existingJob.pattern} → ${config.cronSchedule}`,
                            );

                            // Remove the old schedule
                            await this.scheduleQueue.removeRepeatableByKey(existingJob.key);
                            this.logger.log(`🗑️ Removed outdated schedule for ${config.name}`);

                            // Create a new schedule
                            await this.setUpSchedule(config.name, config.cronSchedule);
                        } else {
                            this.logger.log(
                                `✅ Crawler ${config.name} already has correct schedule: ${config.cronSchedule}`,
                            );
                        }
                    } else {
                        // No existing job, create a new one
                        this.logger.log(
                            `➕ Setting up new schedule for ${config.name} with pattern: ${config.cronSchedule}`,
                        );
                        await this.setUpSchedule(config.name, config.cronSchedule);
                    }
                } else if (existingJob && !config.enabled) {
                    // Crawler is disabled but has a scheduled job - remove it
                    this.logger.log(`🗑️ Removing schedule for disabled crawler: ${config.name}`);
                    await this.scheduleQueue.removeRepeatableByKey(existingJob.key);
                }
            }

            this.logger.log(`✅ Finished initializing crawler schedules`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Error initializing crawler schedules: ${errorMessage}`);
        }
    }

    async process(job: Job<unknown, unknown, CrawlerJobName>): Promise<unknown> {
        this.logger.log(`📝 Processing job ${job.id} of type ${job.name}`);

        try {
            switch (job.name) {
                case 'updateCrawlerConfig':
                    return await this.handleUpdateConfig(job.data as UpdateCrawlerConfigJobData);
                case 'triggerCrawl':
                    return await this.handleTriggerCrawl(job.data as TriggerCrawlJobData);
                case 'scheduledCrawl':
                    return await this.handleScheduledCrawl(job.data as ScheduledCrawlJobData);
                default:
                    throw new Error(`Unknown job type: ${job.name}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Error processing job ${job.id}: ${errorMessage}`);
            throw error;
        }
    }

    /**
     * Handle the updateCrawlerConfig job
     * This updates a crawler's configuration and manages its schedule
     */
    private async handleUpdateConfig(data: UpdateCrawlerConfigJobData): Promise<boolean> {
        const { name, cronSchedule, enabled } = data;

        this.logger.log(`⚙️ Updating configuration for crawler: ${name}`);

        const crawler = await this.getCrawlerByName(name);
        if (!crawler) {
            this.logger.warn(`🔍 No crawler found with name: ${name}`);
            return false;
        }

        try {
            // First, remove any existing scheduled jobs for this crawler
            await this.removeExistingSchedule(name);

            // Update crawler's config (this no longer handles scheduling)
            if (typeof crawler.updateCrawlerConfig === 'function') {
                await crawler.updateCrawlerConfig();
                this.logger.log(`✅ Updated configuration for crawler: ${name}`);
            }

            // If enabled and has a cron schedule, set up new schedule
            if (enabled !== false && cronSchedule) {
                await this.setUpSchedule(name, cronSchedule);
                this.logger.log(
                    `📅 Set up new schedule for crawler: ${name} with pattern: ${cronSchedule}`,
                );
            } else {
                this.logger.log(
                    `⏸️ Crawler ${name} is disabled or has no schedule, skipping schedule setup`,
                );
            }

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Failed to update crawler ${name}: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Handle the triggerCrawl job
     * This triggers a crawler to run based on job data
     */
    private async handleTriggerCrawl(data: TriggerCrawlJobData): Promise<boolean> {
        const { name, slug } = data;

        this.logger.log(`▶️ Triggering crawler: ${name}${slug ? ` for movie: ${slug}` : ''}`);

        const crawler = await this.getCrawlerByName(name);
        if (!crawler) {
            this.logger.warn(`🔍 No crawler found with name: ${name}`);
            return false;
        }

        try {
            await crawler.triggerCrawl(slug);
            this.logger.log(`✅ Successfully triggered crawler: ${name}`);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Failed to trigger crawler ${name}: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Handle the scheduledCrawl job
     * This is executed when a scheduled job triggers
     */
    private async handleScheduledCrawl(data: ScheduledCrawlJobData): Promise<boolean> {
        const { name } = data;

        this.logger.log(`⏰ Running scheduled crawl for: ${name}`);

        const crawler = await this.getCrawlerByName(name);
        if (!crawler) {
            this.logger.warn(`🔍 No crawler found with name: ${name}`);
            return false;
        }

        try {
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
     * Remove any existing scheduled jobs for a crawler
     */
    private async removeExistingSchedule(crawlerName: string): Promise<void> {
        try {
            const jobKey = `schedule:${crawlerName}`;
            this.logger.log(`🔍 Looking for existing schedules for crawler: ${crawlerName}`);

            const repeatableJobs = await this.scheduleQueue.getRepeatableJobs();
            this.logger.debug(
                `📋 Found ${repeatableJobs.length} total repeatable jobs in the system`,
            );

            const existingJob = repeatableJobs.find(
                (job) => job.name === 'scheduledCrawl' && job.id === jobKey,
            );

            if (existingJob) {
                this.logger.log(
                    `🗑️ Removing existing schedule for crawler: ${crawlerName} (key: ${existingJob.key})`,
                );
                await this.scheduleQueue.removeRepeatableByKey(existingJob.key);
                this.logger.log(`✅ Successfully removed existing schedule for: ${crawlerName}`);
            } else {
                this.logger.log(`ℹ️ No existing schedule found for crawler: ${crawlerName}`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `❌ Error removing existing schedule for ${crawlerName}: ${errorMessage}`,
            );
            // We continue even if there's an error removing the job
        }
    }

    /**
     * Set up a new schedule for a crawler using BullMQ's repeatable jobs
     */
    private async setUpSchedule(crawlerName: string, cronPattern: string): Promise<void> {
        const jobKey = `schedule:${crawlerName}`;

        this.logger.log(
            `📅 Setting up new schedule for crawler: ${crawlerName} with pattern: ${cronPattern}`,
        );

        const repeatOptions: CronRepeatOptions = {
            pattern: cronPattern,
            // Optionally add timezone if needed
        };

        try {
            const jobId = await this.scheduleQueue.add(
                'scheduledCrawl',
                { name: crawlerName } as ScheduledCrawlJobData,
                {
                    jobId: jobKey,
                    repeat: repeatOptions,
                },
            );

            this.logger.log(
                `✅ Successfully scheduled crawler: ${crawlerName} (jobId: ${jobId}, key: ${jobKey}, pattern: ${cronPattern})`,
            );

            // Log the next execution time
            const repeatableJobs = await this.scheduleQueue.getRepeatableJobs();
            const newJob = repeatableJobs.find((job) => job.id === jobKey);

            if (newJob) {
                this.logger.log(
                    `⏱️ Next execution for ${crawlerName}: ${new Date(
                        newJob.next,
                    ).toLocaleString()}`,
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Error setting up schedule for ${crawlerName}: ${errorMessage}`);
            throw error;
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
