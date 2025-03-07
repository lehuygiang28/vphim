'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, message, Typography } from 'antd';
import { useCustomMutation } from '@refinedev/core';
import {
    MNT_CRAWLER_SETTINGS_LIST_QUERY,
    MNT_TRIGGER_CRAWLER,
} from '~mnt/queries/crawler-settings.query';
import { useQuery } from '@apollo/client';
import { CrawlerSettingsRecord, TriggerCrawlerInput } from '~mnt/types/crawler-settings.types';

const { Title, Paragraph } = Typography;

interface TriggerFormValues {
    crawler: string;
    slug?: string;
}

export default function CrawlerTriggerPage() {
    const [form] = Form.useForm<TriggerFormValues>();
    const [loading, setLoading] = useState(false);

    // Get the list of available crawlers
    const { data, loading: listLoading } = useQuery(MNT_CRAWLER_SETTINGS_LIST_QUERY, {
        variables: {
            input: {
                page: 1,
                limit: 50,
            },
        },
    });

    const { mutate } = useCustomMutation();

    const handleTrigger = async (values: TriggerFormValues) => {
        setLoading(true);
        try {
            await mutate({
                url: 'triggerCrawler',
                method: 'post',
                values: {
                    input: {
                        name: values.crawler,
                        slug: values.slug || undefined,
                    } satisfies TriggerCrawlerInput,
                },
                meta: {
                    gqlMutation: MNT_TRIGGER_CRAWLER,
                },
                successNotification: {
                    message: 'Crawler Triggered Successfully',
                    description: `${values.crawler} crawler has been triggered${
                        values.slug ? ` for slug: ${values.slug}` : ''
                    }`,
                    type: 'success',
                },
            });
            form.resetFields(['slug']);
        } catch (error) {
            message.error('Failed to trigger crawler');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Card
                title={<Title level={3}>Trigger Crawler</Title>}
                extra={
                    <Button type="link" href="/crawler-settings">
                        View Crawler Settings
                    </Button>
                }
            >
                <Paragraph>
                    Use this form to manually trigger a crawler. You can optionally specify a
                    specific slug to crawl. If no slug is provided, the crawler will run for all
                    available content.
                </Paragraph>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleTrigger}
                    initialValues={{ crawler: data?.crawlerSettings?.data?.[0]?.name }}
                >
                    <Form.Item
                        label="Select Crawler"
                        name="crawler"
                        rules={[{ required: true, message: 'Please select a crawler' }]}
                    >
                        <Select
                            loading={listLoading}
                            placeholder="Select a crawler"
                            options={data?.crawlerSettings?.data?.map(
                                (crawler: CrawlerSettingsRecord) => ({
                                    label: crawler.name,
                                    value: crawler.name,
                                    disabled: !crawler.enabled,
                                }),
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Specific Slug (Optional)"
                        name="slug"
                        tooltip="Enter a specific movie slug to crawl only that movie"
                    >
                        <Input placeholder="E.g. nguoi-nhen-du-hanh-vu-tru-nhen" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Trigger Crawler
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
