import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { createRegex, removeDiacritics, removeTone } from '@vn-utils/text';

import { CrawlerSettingsRepository } from './crawler-settings.repository';
import {
    GetCrawlerSettingsInput,
    GetCrawlerSettingInput,
} from './inputs/get-crawler-settings.input';
import { CrawlerSettings, CrawlerSettingsDocument } from './crawler-settings.schema';
import { CrawlerSettingsType } from './crawler-settings.type';
import { RedisService } from '../../../libs/modules/redis';
import { UpdateCrawlerSettingsInput } from './inputs/update-crawler-settings.input';
import { CreateCrawlerSettingsInput } from './inputs/create-crawler-settings.input';
import { DeleteCrawlerSettingsInput } from './inputs/delete-crawler-settings.input';
import { GetCrawlerSettingsOutput } from './outputs/get-crawler-settings.output';
import { TriggerCrawlerInput } from './inputs/trigger-crawler.input';
import { ModuleRef } from '@nestjs/core';

// Define a simplified interface for BaseCrawler to avoid import cycle
interface CrawlerInstance {
    triggerCrawl(slug?: string): Promise<void>;
}

/**
 * Service responsible for crawler settings management
 * Handles CRUD operations for crawler configurations and crawler triggering
 */
@Injectable()
export class CrawlerSettingsService {
    private readonly logger: Logger;
    private readonly CACHE_KEY_PREFIX = 'CACHED:CRAWLER_SETTINGS';
    private readonly CACHE_TTL = 60 * 60; // 1 hour

    constructor(
        private readonly crawlerSettingsRepo: CrawlerSettingsRepository,
        private readonly redisService: RedisService,
        private readonly moduleRef: ModuleRef,
    ) {
        this.logger = new Logger(CrawlerSettingsService.name);
    }

    /**
     * Maps a MongoDB document to a GraphQL type
     * This handles type conversions like ObjectId to string
     */
    private mapToGraphQLType(document: CrawlerSettings): CrawlerSettingsType {
        return {
            _id: document._id.toString(),
            name: document.name,
            host: document.host,
            cronSchedule: document.cronSchedule,
            forceUpdate: document.forceUpdate,
            enabled: document.enabled,
            imgHost: document.imgHost,
            maxRetries: document.maxRetries,
            rateLimitDelay: document.rateLimitDelay,
            maxConcurrentRequests: document.maxConcurrentRequests,
            maxContinuousSkips: document.maxContinuousSkips,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        };
    }

    /**
     * Get crawler settings with pagination and filtering
     * @param query Filter and pagination parameters
     * @returns Paginated list of crawler settings
     */
    async getCrawlerSettings(query?: GetCrawlerSettingsInput): Promise<GetCrawlerSettingsOutput> {
        try {
            const cacheKey = `${this.CACHE_KEY_PREFIX}:LIST:${JSON.stringify(query || {})}`;

            // Try to get from cache first
            const fromCache = await this.redisService.get<GetCrawlerSettingsOutput>(cacheKey);
            if (fromCache) {
                return fromCache;
            }

            // Build filter query
            const filter = this.buildFilterQuery(query);

            // Set up pagination
            const pagination = this.getPaginationOptions(query);

            // Execute query with repository's find method
            const data = await this.crawlerSettingsRepo.find({
                filterQuery: filter,
                queryOptions: {
                    ...pagination,
                    sort: { createdAt: -1 },
                },
            });

            const total = await this.crawlerSettingsRepo.count(filter);

            // Format result - Map MongoDB documents to GraphQL types
            const result: GetCrawlerSettingsOutput = {
                data: data.map((doc) => this.mapToGraphQLType(doc)),
                total,
            };

            // Cache the result
            await this.redisService.set(cacheKey, result, this.CACHE_TTL);

            return result;
        } catch (error) {
            this.handleServiceError('Error getting crawler settings', error);
        }
    }

    /**
     * Get a single crawler setting by ID or name
     * @param input Search criteria (ID or name)
     * @returns Crawler settings document
     */
    async getCrawlerSetting(input: GetCrawlerSettingInput): Promise<CrawlerSettingsType> {
        try {
            const cacheKey = `${this.CACHE_KEY_PREFIX}:DETAIL:${JSON.stringify(input)}`;

            // Try to get from cache first
            const fromCache = await this.redisService.get<CrawlerSettingsType>(cacheKey);
            if (fromCache) {
                return fromCache;
            }

            // Build filter query
            const filter = this.buildDetailFilterQuery(input);

            // Find the crawler setting
            const crawlerSetting = await this.crawlerSettingsRepo.findOne({
                filterQuery: filter,
            });

            if (!crawlerSetting) {
                throw new HttpException('Crawler Setting not found', HttpStatus.NOT_FOUND);
            }

            // Map to GraphQL type
            const result = this.mapToGraphQLType(crawlerSetting);

            // Cache the result
            await this.redisService.set(cacheKey, result, this.CACHE_TTL);

            return result;
        } catch (error) {
            // If it's already an HttpException, just rethrow it
            if (error instanceof HttpException) {
                throw error;
            }

            this.handleServiceError('Error getting crawler setting', error);
        }
    }

    /**
     * Create a new crawler setting
     * @param input Crawler settings data
     * @returns Created crawler settings document
     */
    async createCrawlerSettings(input: CreateCrawlerSettingsInput): Promise<CrawlerSettingsType> {
        try {
            // Validate input
            this.validateCreateInput(input);

            // Ensure default values for optional fields
            const documentWithDefaults = {
                name: input.name,
                host: input.host,
                cronSchedule: input.cronSchedule || '0 0 * * *',
                forceUpdate: input.forceUpdate !== undefined ? input.forceUpdate : false,
                enabled: input.enabled !== undefined ? input.enabled : true,
                imgHost: input.imgHost || null,
                maxRetries: input.maxRetries || 3,
                rateLimitDelay: input.rateLimitDelay || 1000,
                maxConcurrentRequests: input.maxConcurrentRequests || 5,
                maxContinuousSkips: input.maxContinuousSkips || 10,
            };

            // Create new setting
            const crawlerSetting = await this.crawlerSettingsRepo.create({
                document: documentWithDefaults,
            });

            // Clear cache
            await this.clearCache();

            // Map to GraphQL type
            return this.mapToGraphQLType(crawlerSetting);
        } catch (error) {
            this.handleDatabaseError('create crawler settings', error);
        }
    }

    /**
     * Update an existing crawler setting
     * @param input Update data with ID
     * @returns Updated crawler settings document
     */
    async updateCrawlerSettings(input: UpdateCrawlerSettingsInput): Promise<CrawlerSettingsType> {
        try {
            // Validate ID
            if (!input._id) {
                throw new HttpException('ID is required', HttpStatus.BAD_REQUEST);
            }

            // Convert ID string to ObjectId
            const objectId = this.safelyConvertToObjectId(input._id);

            // Get current settings to ensure we have all values
            const currentSettings = await this.crawlerSettingsRepo.findOne({
                filterQuery: { _id: objectId },
            });

            if (!currentSettings) {
                throw new HttpException('Crawler Setting not found', HttpStatus.NOT_FOUND);
            }

            // Create update object with appropriate defaults
            const updateData = {
                name: input.name || currentSettings.name,
                host: input.host || currentSettings.host,
                cronSchedule: input.cronSchedule || currentSettings.cronSchedule || '0 0 * * *',
                forceUpdate:
                    input.forceUpdate !== undefined
                        ? input.forceUpdate
                        : currentSettings.forceUpdate || false,
                enabled:
                    input.enabled !== undefined
                        ? input.enabled
                        : currentSettings.enabled !== undefined
                        ? currentSettings.enabled
                        : true,
                imgHost: input.imgHost || currentSettings.imgHost || null,
                maxRetries: input.maxRetries || currentSettings.maxRetries || 3,
                rateLimitDelay: input.rateLimitDelay || currentSettings.rateLimitDelay || 1000,
                maxConcurrentRequests:
                    input.maxConcurrentRequests || currentSettings.maxConcurrentRequests || 5,
                maxContinuousSkips:
                    input.maxContinuousSkips || currentSettings.maxContinuousSkips || 10,
            };

            // Update the setting
            const crawlerSetting = await this.crawlerSettingsRepo.findOneAndUpdate({
                filterQuery: { _id: objectId },
                updateQuery: { $set: updateData },
                queryOptions: { new: true },
            });

            if (!crawlerSetting) {
                throw new HttpException('Crawler Setting not found', HttpStatus.NOT_FOUND);
            }

            // Clear cache
            await this.clearCache();

            // Map to GraphQL type
            return this.mapToGraphQLType(crawlerSetting);
        } catch (error) {
            this.handleDatabaseError('update crawler settings', error);
        }
    }

    /**
     * Delete a crawler setting
     * @param input Delete criteria with ID
     * @returns Number of deleted documents
     */
    async deleteCrawlerSettings(input: DeleteCrawlerSettingsInput): Promise<number> {
        try {
            // Validate ID
            if (!input._id) {
                throw new HttpException('ID is required', HttpStatus.BAD_REQUEST);
            }

            // Convert ID string to ObjectId
            const objectId = this.safelyConvertToObjectId(input._id);

            // Delete the setting
            const result = await this.crawlerSettingsRepo.deleteOne({
                _id: objectId,
            });

            // Clear cache
            await this.clearCache();

            return result.deletedCount || 0;
        } catch (error) {
            this.handleDatabaseError('delete crawler settings', error);
        }
    }

    /**
     * Trigger a crawler to run with optional slug
     * @param input Crawler name and optional slug
     * @returns Success indicator
     */
    async triggerCrawler(input: TriggerCrawlerInput): Promise<boolean> {
        try {
            const { name, slug } = input;

            if (!name) {
                throw new HttpException('Crawler name is required', HttpStatus.BAD_REQUEST);
            }

            this.logger.log(
                `Trying to trigger crawler: ${name}${slug ? ` with slug: ${slug}` : ''}`,
            );

            // Get the crawler instance
            let crawlerInstance: CrawlerInstance;
            try {
                crawlerInstance = await this.findCrawlerInstance(name);
                this.logger.log(`Successfully found crawler instance for: ${name}`);
            } catch (error) {
                this.logger.error(`Failed to find crawler instance for: ${name}`, error);
                throw error;
            }

            // Ensure the crawler has a triggerCrawl method
            if (typeof crawlerInstance.triggerCrawl !== 'function') {
                this.logger.error(`Crawler ${name} doesn't have a triggerCrawl method`);
                throw new HttpException(
                    `Crawler ${name} doesn't have a trigger method`,
                    HttpStatus.BAD_REQUEST,
                );
            }

            // Call the crawler's triggerCrawl method with the slug if provided
            this.logger.log(`Triggering crawler: ${name}${slug ? ` with slug: ${slug}` : ''}`);
            try {
                await crawlerInstance.triggerCrawl(slug);
                this.logger.log(`Successfully triggered crawler: ${name}`);
            } catch (error) {
                this.logger.error(`Error during crawler execution for ${name}:`, error);
                throw new HttpException(
                    `Error executing crawler ${name}: ${error.message}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return true;
        } catch (error) {
            this.handleServiceError('Error triggering crawler', error);
        }
    }

    /**
     * Find a crawler instance by name
     * @param name Name of the crawler
     * @returns Crawler instance
     * @private
     */
    private async findCrawlerInstance(name: string): Promise<CrawlerInstance> {
        try {
            // Standardize the name (lowercase)
            const normalizedName = name.toLowerCase();

            // Generate capitalized version for multi-word names
            const capitalizedName = normalizedName
                .split(/[^a-zA-Z0-9]/)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');

            // Special case for KKPhim - it needs to be exactly "KKPhimCrawler"
            const isKkphim = normalizedName === 'kkphim';

            // Try different naming conventions
            const crawlerClassNames = [
                // Special case for KKPhim with two capital letters
                isKkphim ? 'KKPhimCrawler' : null,

                // Standard camelCase for most crawlers: OphimCrawler, NguoncCrawler
                `${normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1)}Crawler`,

                // Try with all uppercase first letters for each segment
                `${capitalizedName}Crawler`,

                // Try with all uppercase
                `${normalizedName.toUpperCase()}Crawler`,

                // Direct name match
                name,
            ].filter(Boolean); // Remove nulls

            this.logger.log(`Looking for crawler with name: ${name}`);
            this.logger.log(`Trying the following class names: ${crawlerClassNames.join(', ')}`);

            let crawlerInstance: CrawlerInstance | undefined;

            for (const className of crawlerClassNames) {
                try {
                    this.logger.log(`Attempting to get instance with name: ${className}`);
                    crawlerInstance = this.moduleRef.get(className, { strict: false });
                    if (crawlerInstance) {
                        this.logger.log(`Found crawler instance with name: ${className}`);
                        break;
                    }
                } catch (e) {
                    this.logger.debug(`Failed to get instance with name: ${className}`);
                    // Continue to next attempt
                }
            }

            if (!crawlerInstance) {
                // Log all available providers for debugging
                this.logger.error(
                    `Crawler ${name} not found. Available providers might not include this crawler.`,
                );
                throw new HttpException(`Crawler ${name} not found`, HttpStatus.NOT_FOUND);
            }

            return crawlerInstance;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            this.logger.error(`Failed to find crawler: ${error.message}`);
            throw new HttpException(`Crawler ${name} not found`, HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Build filter query for list operation
     * @param query Query parameters
     * @returns Mongoose filter query
     * @private
     */
    private buildFilterQuery(
        query?: GetCrawlerSettingsInput,
    ): FilterQuery<CrawlerSettingsDocument> {
        const filter: FilterQuery<CrawlerSettingsDocument> = {};

        if (!query) return filter;

        if (query.search) {
            const search = createRegex(query.search);
            filter.name = search;
        }

        if (query.name) {
            filter.name = query.name;
        }

        return filter;
    }

    /**
     * Build filter query for detail operation
     * @param input Search criteria
     * @returns Mongoose filter query
     * @private
     */
    private buildDetailFilterQuery(
        input: GetCrawlerSettingInput,
    ): FilterQuery<CrawlerSettingsDocument> {
        const filter: FilterQuery<CrawlerSettingsDocument> = {};

        if (input._id) {
            try {
                filter._id = new Types.ObjectId(input._id);
            } catch (e) {
                throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
            }
        }

        if (input.name) {
            filter.name = input.name;
        }

        if (!input._id && !input.name) {
            throw new HttpException('ID or name is required', HttpStatus.BAD_REQUEST);
        }

        return filter;
    }

    /**
     * Get pagination options from query
     * @param query Query parameters
     * @returns Pagination options
     * @private
     */
    private getPaginationOptions(query?: GetCrawlerSettingsInput): { skip: number; limit: number } {
        const page = query?.page || 1;
        const limit = query?.limit || 20;
        const skip = (page - 1) * limit;

        return { skip, limit };
    }

    /**
     * Clear all crawler settings cache
     * @private
     */
    private async clearCache(): Promise<void> {
        try {
            await this.redisService.delWithPrefix(`${this.CACHE_KEY_PREFIX}:*`);
        } catch (error) {
            this.logger.error(
                `Error clearing crawler settings cache: ${error.message}`,
                error.stack,
            );
        }
    }

    /**
     * Safely convert a string ID to ObjectId
     * @param id ID string
     * @returns MongoDB ObjectId
     * @private
     */
    private safelyConvertToObjectId(id: string): Types.ObjectId {
        try {
            return new Types.ObjectId(id);
        } catch (error) {
            throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Validate create input
     * @param input Create crawler settings input
     * @private
     */
    private validateCreateInput(input: CreateCrawlerSettingsInput): void {
        if (!input.name) {
            throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
        }

        if (!input.host) {
            throw new HttpException('Host is required', HttpStatus.BAD_REQUEST);
        }

        if (!input.cronSchedule) {
            throw new HttpException('Cron schedule is required', HttpStatus.BAD_REQUEST);
        }

        // Validate cron schedule format (basic validation)
        const cronParts = input.cronSchedule.split(' ');
        if (cronParts.length < 5) {
            throw new HttpException('Invalid cron schedule format', HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Handle service errors consistently
     * @param message Error message prefix
     * @param error Error object
     * @private
     */
    private handleServiceError(message: string, error: Error | HttpException | unknown): never {
        if (error instanceof Error || error instanceof HttpException) {
            this.logger.error(`${message}: ${error.message}`, error.stack);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                `${message}: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        // Handle non-Error objects
        const errorString = error instanceof Object ? JSON.stringify(error) : String(error);
        this.logger.error(`${message}: ${errorString}`);
        throw new HttpException(`${message}: Unknown error`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Handle database operation errors consistently
     * @param operation Operation description
     * @param error Error object
     * @private
     */
    private handleDatabaseError(
        operation: string,
        error:
            | Error
            | HttpException
            | { code?: number; keyPattern?: Record<string, unknown>; name?: string },
    ): never {
        // Handle duplicate key errors
        if (
            ('code' in error && error.code === 11000) ||
            ('name' in error && error.name === 'MongoServerError')
        ) {
            const mongoError = error as { keyPattern?: Record<string, unknown> };
            const field = Object.keys(mongoError.keyPattern || {})[0] || 'name';
            throw new HttpException(
                `Crawler settings with this ${field} already exists`,
                HttpStatus.CONFLICT,
            );
        }

        // If it's already an HttpException, just rethrow it
        if (error instanceof HttpException) {
            throw error;
        }

        // Use type-guard to safely access message and stack properties
        const errorMessage = 'message' in error ? error.message : 'Unknown error';
        const errorStack = 'stack' in error ? error.stack : undefined;

        this.logger.error(`Failed to ${operation}: ${errorMessage}`, errorStack);
        throw new HttpException(`Failed to ${operation}: ${errorMessage}`, HttpStatus.BAD_REQUEST);
    }
}
