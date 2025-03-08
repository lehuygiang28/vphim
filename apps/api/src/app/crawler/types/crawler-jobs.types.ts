/**
 * Types of crawler jobs that can be processed through the queue
 */
export type CrawlerJobName = 'updateCrawlerConfig' | 'triggerCrawl' | 'scheduledCrawl';

/**
 * Data structure for the updateCrawlerConfig job
 */
export interface UpdateCrawlerConfigJobData {
    name: string;
    cronSchedule?: string;
    forceUpdate?: boolean;
    enabled?: boolean;
    host?: string;
    imgHost?: string;
    maxRetries?: number;
    rateLimitDelay?: number;
    maxConcurrentRequests?: number;
    maxContinuousSkips?: number;
}

/**
 * Data structure for the triggerCrawl job
 */
export interface TriggerCrawlJobData {
    name: string;
    slug?: string;
}

/**
 * Data structure for the scheduledCrawl job
 */
export interface ScheduledCrawlJobData {
    name: string;
}

/**
 * Repeat options for BullMQ jobs using cron syntax
 */
export interface CronRepeatOptions {
    pattern: string;
    tz?: string; // timezone
}

/**
 * Union type for all crawler job data types
 */
export type CrawlerJobData =
    | UpdateCrawlerConfigJobData
    | TriggerCrawlJobData
    | ScheduledCrawlJobData;
