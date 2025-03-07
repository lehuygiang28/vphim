import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
    Connection,
    Model,
    SaveOptions,
    FilterQuery,
    QueryOptions,
    ProjectionType,
    UpdateQuery,
} from 'mongoose';

import { AbstractRepository } from '../../../libs/abstract/abstract.repository';
import { CrawlerSettings, CrawlerSettingsDocument } from './crawler-settings.schema';

/**
 * Repository for managing crawler settings in the database
 * Extends AbstractRepository to provide common database operations
 * with additional validation and error handling
 */
@Injectable()
export class CrawlerSettingsRepository extends AbstractRepository<CrawlerSettingsDocument> {
    protected readonly logger = new Logger(CrawlerSettingsRepository.name);

    constructor(
        @InjectModel(CrawlerSettings.name)
        protected readonly crawlerSettingsModel: Model<CrawlerSettingsDocument>,
        @InjectConnection() connection: Connection,
    ) {
        super(crawlerSettingsModel, connection);
        this.logger.log('CrawlerSettingsRepository initialized');
    }

    /**
     * Create a new crawler settings document
     * @param params Creation parameters
     * @returns Created document
     */
    async create(params: {
        document: Omit<CrawlerSettings, '_id'>;
        saveOptions?: SaveOptions;
        session?: unknown;
    }): Promise<CrawlerSettingsDocument> {
        try {
            // Perform validation before creating
            this.validateCreateDocument(params.document);

            // Normalize the data (ensure consistent format)
            const normalizedDocument = this.normalizeDocument(params.document);

            // Call the parent create method with normalized data
            return this.crawlerSettingsModel.create(normalizedDocument);
        } catch (error) {
            this.logger.error(`Error creating crawler settings: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Find one crawler settings document
     * @param params Find parameters
     * @returns Found document or null
     */
    async findOne(params: {
        filterQuery: FilterQuery<CrawlerSettingsDocument>;
        queryOptions?: QueryOptions<CrawlerSettingsDocument>;
        projectionType?: ProjectionType<CrawlerSettingsDocument>;
    }): Promise<CrawlerSettingsDocument | null> {
        try {
            return await super.findOne(params);
        } catch (error) {
            this.logger.error(`Error finding crawler setting: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Update a crawler settings document
     * @param params Update parameters
     * @returns Updated document
     */
    async findOneAndUpdate(params: {
        filterQuery: FilterQuery<CrawlerSettingsDocument>;
        updateQuery: UpdateQuery<CrawlerSettingsDocument>;
        queryOptions?: QueryOptions<CrawlerSettingsDocument>;
    }): Promise<CrawlerSettingsDocument | null> {
        try {
            // If we're updating crawler settings, validate the update
            if (params.updateQuery.$set) {
                this.validateUpdateDocument(params.updateQuery.$set as Partial<CrawlerSettings>);
            }

            return await super.findOneAndUpdate(params);
        } catch (error) {
            this.logger.error(`Error updating crawler setting: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Validate document before creating
     * @param document Document to validate
     * @private
     */
    private validateCreateDocument(document: Omit<CrawlerSettings, '_id'>): void {
        // Check required fields
        if (!document.name) {
            throw new Error('Crawler name is required');
        }

        if (!document.host) {
            throw new Error('Crawler host is required');
        }

        if (!document.cronSchedule) {
            throw new Error('Crawler cron schedule is required');
        }

        // Validate cron schedule format (basic validation)
        this.validateCronSchedule(document.cronSchedule);

        // Validate URL format for host
        this.validateUrl(document.host, 'Host');

        // Validate URL format for imgHost if provided
        if (document.imgHost) {
            this.validateUrl(document.imgHost, 'Image host');
        }
    }

    /**
     * Validate document before updating
     * @param document Document fields to update
     * @private
     */
    private validateUpdateDocument(document: Partial<CrawlerSettings>): void {
        // If updating cronSchedule, validate format
        if (document.cronSchedule) {
            this.validateCronSchedule(document.cronSchedule);
        }

        // If updating host, validate URL
        if (document.host) {
            this.validateUrl(document.host, 'Host');
        }

        // If updating imgHost, validate URL
        if (document.imgHost) {
            this.validateUrl(document.imgHost, 'Image host');
        }
    }

    /**
     * Validate cron schedule format
     * @param cronSchedule Cron schedule string
     * @private
     */
    private validateCronSchedule(cronSchedule: string): void {
        const cronParts = cronSchedule.split(' ');
        if (cronParts.length < 5) {
            throw new Error('Invalid cron schedule format');
        }
    }

    /**
     * Validate URL format
     * @param url URL to validate
     * @param fieldName Name of the field for error message
     * @private
     */
    private validateUrl(url: string, fieldName: string): void {
        try {
            // Simple validation that it's a valid URL
            new URL(url);
        } catch (e) {
            throw new Error(`${fieldName} must be a valid URL`);
        }
    }

    /**
     * Normalize document before saving
     * @param document Document to normalize
     * @returns Normalized document
     * @private
     */
    private normalizeDocument(
        document: Omit<CrawlerSettings, '_id'>,
    ): Omit<CrawlerSettings, '_id'> {
        return {
            ...document,
            // Ensure URLs have protocol
            host: this.ensureProtocol(document.host),
            imgHost: document.imgHost ? this.ensureProtocol(document.imgHost) : document.imgHost,
            // Default values
            enabled: document.enabled ?? true,
            forceUpdate: document.forceUpdate ?? false,
        };
    }

    /**
     * Ensure URL has a protocol
     * @param url URL to check
     * @returns URL with protocol
     * @private
     */
    private ensureProtocol(url: string): string {
        if (!url) return url;

        // If URL doesn't start with http:// or https://, add https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }

        return url;
    }
}
