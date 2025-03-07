'use client';

import React from 'react';

import {
    MNT_CRAWLER_SETTINGS_LIST_QUERY,
    MNT_CRAWLER_SETTING_DELETE,
} from '~mnt/queries/crawler-settings.query';
import { CrawlerSettingsList } from '~mnt/components/crawler-settings/crawler-settings-list';

export default function CrawlerSettingsListPage() {
    return (
        <CrawlerSettingsList
            createPath="/crawler-settings/create"
            gqlQuery={MNT_CRAWLER_SETTINGS_LIST_QUERY}
            gqlDeleteMutation={MNT_CRAWLER_SETTING_DELETE}
        />
    );
}
