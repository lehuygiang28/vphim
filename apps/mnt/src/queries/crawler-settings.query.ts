import gql from 'graphql-tag';

export const MNT_CRAWLER_SETTINGS_LIST_QUERY = gql`
    query GetCrawlerSettings($input: GetCrawlerSettingsInput!) {
        crawlerSettings(input: $input) {
            data {
                _id
                name
                host
                cronSchedule
                forceUpdate
                enabled
                imgHost
                maxRetries
                rateLimitDelay
                maxConcurrentRequests
                maxContinuousSkips
                updatedAt
            }
            total
        }
    }
`;

export const MNT_CRAWLER_SETTING_CREATE = gql`
    mutation CreateCrawlerSettings($input: CreateCrawlerSettingsInput!) {
        createCrawlerSettings(input: $input) {
            _id
        }
    }
`;

export const MNT_CRAWLER_SETTING_QUERY = gql`
    query GetCrawlerSetting($input: GetCrawlerSettingInput!) {
        crawlerSetting(input: $input) {
            _id
            name
            host
            cronSchedule
            forceUpdate
            enabled
            imgHost
            maxRetries
            rateLimitDelay
            maxConcurrentRequests
            maxContinuousSkips
        }
    }
`;

export const MNT_CRAWLER_SETTING_UPDATE = gql`
    mutation UpdateCrawlerSettings($input: UpdateCrawlerSettingsInput!) {
        updateCrawlerSettings(input: $input) {
            _id
        }
    }
`;

export const MNT_CRAWLER_SETTING_DELETE = gql`
    mutation DeleteCrawlerSettings($input: DeleteCrawlerSettingsInput!) {
        deleteCrawlerSettings(input: $input)
    }
`;

export const MNT_TRIGGER_CRAWLER = gql`
    mutation TriggerCrawler($input: TriggerCrawlerInput!) {
        triggerCrawler(input: $input)
    }
`;
