'use client';

import React from 'react';
import { MNT_CRAWLER_SETTING_CREATE } from '~mnt/queries/crawler-settings.query';
import { CrawlerSettingsForm } from '~mnt/components/crawler-settings/crawler-settings-form';

export default function CreateCrawlerSettings() {
    return (
        <CrawlerSettingsForm
            action="create"
            redirect="/crawler-settings"
            mutation={MNT_CRAWLER_SETTING_CREATE}
        />
    );
}
