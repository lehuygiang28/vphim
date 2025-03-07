import { DocumentNode } from 'graphql';
import {
    CreateCrawlerSettingsInput,
    UpdateCrawlerSettingsInput,
    GetCrawlerSettingsInput,
    GetCrawlerSettingInput,
    DeleteCrawlerSettingsInput,
    TriggerCrawlerInput,
    GetCrawlerSettingsOutput,
    CrawlerSettings,
    CrawlerSettingsType,
} from '~api/app/crawler';

/**
 * Re-exported API types for crawler settings
 * These types are directly imported from the API and re-exported for use in the UI
 */
export {
    CreateCrawlerSettingsInput,
    UpdateCrawlerSettingsInput,
    GetCrawlerSettingsInput,
    GetCrawlerSettingInput,
    DeleteCrawlerSettingsInput,
    TriggerCrawlerInput,
    GetCrawlerSettingsOutput,
    CrawlerSettings,
    CrawlerSettingsType,
};

/**
 * GraphQL query interface
 * Used to type GraphQL queries and mutations in Refine components
 */
export interface GraphQLQuery {
    query: DocumentNode;
    variables?: Record<string, unknown>;
}

/**
 * CrawlerSettingsRecord interface
 * Represents a crawler settings record as returned from the API and displayed in UI components.
 * Extends the API's CrawlerSettingsType with MongoDB-specific fields (_id, timestamps)
 */
export interface CrawlerSettingsRecord extends CrawlerSettingsType {
    _id: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Form data types
 * Specialized types for form inputs to ensure type safety in form components
 */
export type CrawlerSettingsFormData = Omit<CrawlerSettings, '_id'>;
export type CrawlerSettingsEditFormData = UpdateCrawlerSettingsInput;
