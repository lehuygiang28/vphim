'use client';

import React from 'react';
import { MNT_CRAWLER_SETTING_QUERY } from '~mnt/queries/crawler-settings.query';
import { CrawlerSettingsShow } from '~mnt/components/crawler-settings/crawler-settings-show';

export default function ShowCrawlerSettings({ params }: { params: { id: string } }) {
    const { id } = params;

    return <CrawlerSettingsShow id={id} gqlQuery={MNT_CRAWLER_SETTING_QUERY} />;
}
