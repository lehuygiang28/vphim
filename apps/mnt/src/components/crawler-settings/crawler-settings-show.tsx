'use client';

import React from 'react';
import { useShow, useUpdate } from '@refinedev/core';
import {
    Card,
    Descriptions,
    Button,
    Space,
    Tag,
    Typography,
    Alert,
    Tooltip,
    Row,
    Col,
    Statistic,
    Badge,
    Timeline,
    Tabs,
} from 'antd';
import {
    EditOutlined,
    PlayCircleOutlined,
    SettingOutlined,
    GlobalOutlined,
    FieldTimeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    CodeOutlined,
    CalendarOutlined,
    RetweetOutlined,
    HistoryOutlined,
    LaptopOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { MNT_TRIGGER_CRAWLER } from '~mnt/queries/crawler-settings.query';
import { DocumentNode } from 'graphql';
import { CrawlerSettingsRecord, TriggerCrawlerInput } from '~mnt/types/crawler-settings.types';
import { Show } from '@refinedev/antd';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface CrawlerSettingsShowProps {
    id: string;
    gqlQuery: DocumentNode;
}

export const CrawlerSettingsShow: React.FC<CrawlerSettingsShowProps> = ({ id, gqlQuery }) => {
    const { query } = useShow<CrawlerSettingsRecord>({
        dataProviderName: 'graphql',
        resource: 'crawlerSettings',
        id,
        meta: {
            gqlQuery,
            variables: {
                input: {
                    _id: id,
                },
            },
        },
    });

    const { mutate } = useUpdate();

    const record = query?.data?.data;

    const triggerCrawler = () => {
        if (!record) return;

        mutate({
            dataProviderName: 'graphql',
            resource: 'triggerCrawler',
            id: record.name,
            values: {},
            meta: {
                gqlMutation: MNT_TRIGGER_CRAWLER,
                variables: {
                    input: {
                        name: record.name,
                    } satisfies TriggerCrawlerInput,
                },
            },
            successNotification: {
                message: 'Crawler Triggered',
                description: `${record.name} crawler has been triggered successfully`,
                type: 'success',
            },
            errorNotification: {
                message: 'Failed to Trigger Crawler',
                description: `Failed to trigger ${record.name} crawler. Please check the logs.`,
                type: 'error',
            },
        });
    };

    const isCrawlerDisabled = record?.enabled === false;

    // Format dates to human readable format
    const createdDate = record?.createdAt ? new Date(record.createdAt) : null;
    const updatedDate = record?.updatedAt ? new Date(record.updatedAt) : null;

    const formattedCreatedDate = createdDate ? createdDate.toLocaleString() : '-';
    const formattedUpdatedDate = updatedDate ? updatedDate.toLocaleString() : '-';

    // Calculate time since last update
    const getTimeSinceUpdate = () => {
        if (!updatedDate) return '-';

        const now = new Date();
        const diffMs = now.getTime() - updatedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }

        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    };

    return (
        <Show>
            <div style={{ padding: '0 24px' }}>
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card bordered={false}>
                            <Row gutter={[32, 16]} align="middle">
                                <Col xs={24} sm={18} md={18} lg={18}>
                                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                        <Space align="center">
                                            <CodeOutlined style={{ fontSize: 20 }} />
                                            <Title level={3} style={{ margin: 0 }}>
                                                {record?.name || 'Loading...'}
                                            </Title>
                                            {record?.enabled ? (
                                                <Tag color="success" icon={<CheckCircleOutlined />}>
                                                    Enabled
                                                </Tag>
                                            ) : (
                                                <Tag color="error" icon={<CloseCircleOutlined />}>
                                                    Disabled
                                                </Tag>
                                            )}
                                        </Space>
                                        <Space>
                                            <GlobalOutlined />
                                            <a href={record?.host} target="_blank" rel="noreferrer">
                                                {record?.host}
                                            </a>
                                        </Space>
                                    </Space>
                                </Col>
                                <Col xs={24} sm={6} md={6} lg={6} style={{ textAlign: 'right' }}>
                                    <Space>
                                        <Tooltip
                                            title={
                                                isCrawlerDisabled
                                                    ? 'This crawler is disabled. Enable it first to trigger.'
                                                    : 'Run the crawler now'
                                            }
                                        >
                                            <Button
                                                type="primary"
                                                icon={<PlayCircleOutlined />}
                                                onClick={triggerCrawler}
                                                disabled={isCrawlerDisabled}
                                            >
                                                Trigger Now
                                            </Button>
                                        </Tooltip>
                                        <Button
                                            type="default"
                                            icon={<EditOutlined />}
                                            onClick={() => {
                                                window.location.href = `/crawler-settings/edit/${id}`;
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    {isCrawlerDisabled && (
                        <Col span={24}>
                            <Alert
                                message="Crawler Disabled"
                                description="This crawler is currently disabled and will not run on schedule."
                                type="warning"
                                showIcon
                            />
                        </Col>
                    )}

                    {/* Stats Row */}
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Schedule"
                                value={record?.cronSchedule || '-'}
                                prefix={<FieldTimeOutlined />}
                                valueStyle={{ fontSize: '16px' }}
                            />
                            <Text type="secondary">Cron expression</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Last Updated"
                                value={getTimeSinceUpdate()}
                                prefix={<ClockCircleOutlined />}
                                valueStyle={{ fontSize: '16px' }}
                            />
                            <Text type="secondary">{formattedUpdatedDate}</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Force Update"
                                value={record?.forceUpdate ? 'Yes' : 'No'}
                                prefix={<SyncOutlined />}
                                valueStyle={{
                                    fontSize: '16px',
                                    color: record?.forceUpdate ? '#fa8c16' : '#8c8c8c',
                                }}
                            />
                            <Text type="secondary">
                                {record?.forceUpdate
                                    ? 'Updates existing records'
                                    : 'Skips existing records'}
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card bordered={false}>
                            <Statistic
                                title="Max Retries"
                                value={record?.maxRetries ?? 'Default'}
                                prefix={<RetweetOutlined />}
                                valueStyle={{ fontSize: '16px' }}
                            />
                            <Text type="secondary">For failed requests</Text>
                        </Card>
                    </Col>

                    {/* Details Tabs */}
                    <Col span={24}>
                        <Card bordered={false} bodyStyle={{ padding: 0 }}>
                            <Tabs defaultActiveKey="config" type="card">
                                <TabPane
                                    tab={
                                        <span>
                                            <SettingOutlined /> Configuration
                                        </span>
                                    }
                                    key="config"
                                >
                                    <Row gutter={[24, 24]}>
                                        <Col xs={24} md={12}>
                                            <Card
                                                title={
                                                    <Space>
                                                        <GlobalOutlined />
                                                        <span>Basic Settings</span>
                                                    </Space>
                                                }
                                                bordered={false}
                                                type="inner"
                                            >
                                                <Descriptions bordered column={1} size="small">
                                                    <Descriptions.Item label="Name">
                                                        <Text strong>{record?.name}</Text>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Host URL">
                                                        <a
                                                            href={record?.host}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {record?.host}
                                                        </a>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Image Host">
                                                        {record?.imgHost ? (
                                                            <a
                                                                href={record?.imgHost}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {record?.imgHost}
                                                            </a>
                                                        ) : (
                                                            <Text type="secondary">
                                                                Not specified
                                                            </Text>
                                                        )}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Cron Schedule">
                                                        <Tag
                                                            color="blue"
                                                            icon={<FieldTimeOutlined />}
                                                        >
                                                            {record?.cronSchedule}
                                                        </Tag>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Status">
                                                        {record?.enabled ? (
                                                            <Badge
                                                                status="success"
                                                                text="Enabled"
                                                            />
                                                        ) : (
                                                            <Badge status="error" text="Disabled" />
                                                        )}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Force Update">
                                                        {record?.forceUpdate ? (
                                                            <Tag
                                                                color="orange"
                                                                icon={<SyncOutlined />}
                                                            >
                                                                Yes
                                                            </Tag>
                                                        ) : (
                                                            <Tag color="default">No</Tag>
                                                        )}
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            </Card>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Card
                                                title={
                                                    <Space>
                                                        <LaptopOutlined />
                                                        <span>Performance Settings</span>
                                                    </Space>
                                                }
                                                bordered={false}
                                                type="inner"
                                            >
                                                <Descriptions bordered column={1} size="small">
                                                    <Descriptions.Item label="Max Retries">
                                                        {record?.maxRetries ?? (
                                                            <Text type="secondary">Default</Text>
                                                        )}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Rate Limit Delay">
                                                        {record?.rateLimitDelay ? (
                                                            <span>{record.rateLimitDelay} ms</span>
                                                        ) : (
                                                            <Text type="secondary">Default</Text>
                                                        )}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Max Concurrent Requests">
                                                        {record?.maxConcurrentRequests ?? (
                                                            <Text type="secondary">Default</Text>
                                                        )}
                                                    </Descriptions.Item>
                                                    <Descriptions.Item label="Max Continuous Skips">
                                                        {record?.maxContinuousSkips ?? (
                                                            <Text type="secondary">Default</Text>
                                                        )}
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            </Card>
                                        </Col>
                                    </Row>
                                </TabPane>
                                <TabPane
                                    tab={
                                        <span>
                                            <HistoryOutlined /> History
                                        </span>
                                    }
                                    key="history"
                                >
                                    <Card bordered={false} type="inner">
                                        <Timeline>
                                            <Timeline.Item
                                                dot={
                                                    <CalendarOutlined
                                                        style={{ fontSize: '16px' }}
                                                    />
                                                }
                                                color="blue"
                                            >
                                                <Text strong>Created</Text>
                                                <div>{formattedCreatedDate}</div>
                                            </Timeline.Item>
                                            <Timeline.Item
                                                dot={<SyncOutlined style={{ fontSize: '16px' }} />}
                                                color="green"
                                            >
                                                <Text strong>Last Updated</Text>
                                                <div>{formattedUpdatedDate}</div>
                                            </Timeline.Item>
                                        </Timeline>
                                    </Card>
                                    <Card
                                        title={
                                            <Space>
                                                <ThunderboltOutlined />
                                                <span>Quick Actions</span>
                                            </Space>
                                        }
                                        bordered={false}
                                        type="inner"
                                        style={{ marginTop: 16 }}
                                    >
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Button
                                                type="primary"
                                                icon={<PlayCircleOutlined />}
                                                onClick={triggerCrawler}
                                                disabled={isCrawlerDisabled}
                                                block
                                            >
                                                Trigger Crawler Now
                                            </Button>
                                            <Button
                                                type="default"
                                                icon={<EditOutlined />}
                                                onClick={() => {
                                                    window.location.href = `/crawler-settings/edit/${id}`;
                                                }}
                                                block
                                            >
                                                Edit Configuration
                                            </Button>
                                        </Space>
                                    </Card>
                                </TabPane>
                            </Tabs>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Show>
    );
};
