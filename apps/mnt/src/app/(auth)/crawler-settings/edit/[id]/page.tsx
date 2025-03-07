'use client';

import React from 'react';
import {
    MNT_CRAWLER_SETTING_UPDATE,
    MNT_CRAWLER_SETTING_QUERY,
} from '~mnt/queries/crawler-settings.query';
import { CrawlerSettingsForm } from '~mnt/components/crawler-settings/crawler-settings-form';

export default function EditCrawlerSettings({ params }: { params: { id: string } }) {
    const { id } = params;

    return (
        <CrawlerSettingsForm
            action="edit"
            id={id}
            redirect="list"
            mutation={MNT_CRAWLER_SETTING_UPDATE}
            query={MNT_CRAWLER_SETTING_QUERY}
        />
    );
}
