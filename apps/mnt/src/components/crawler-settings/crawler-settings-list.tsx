'use client';

import React from 'react';
import { useTable, EditButton, ShowButton, DeleteButton, DateField } from '@refinedev/antd';
import { HttpError, useUpdate } from '@refinedev/core';
import {
    Table,
    Space,
    Button,
    Tooltip,
    Badge,
    Tag,
    Typography,
    Card,
    Row,
    Col,
    Statistic,
    Input,
    Form,
    Alert,
} from 'antd';
import {
    PlayCircleOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { MNT_TRIGGER_CRAWLER } from '~mnt/queries/crawler-settings.query';
import { DocumentNode } from 'graphql';
import { CrawlerSettingsRecord, TriggerCrawlerInput } from '~mnt/types/crawler-settings.types';

const { Title, Paragraph } = Typography;

interface CrawlerSettingsListProps {
    gqlQuery: DocumentNode;
    gqlDeleteMutation: DocumentNode;
    createPath: string;
}

interface SearchFormValues {
    name?: string;
}

export const CrawlerSettingsList: React.FC<CrawlerSettingsListProps> = ({
    gqlQuery,
    gqlDeleteMutation,
    createPath,
}) => {
    const { tableProps, searchFormProps } = useTable<
        CrawlerSettingsRecord,
        HttpError,
        SearchFormValues
    >({
        dataProviderName: 'graphql',
        resource: 'crawlerSettings',
        meta: {
            gqlQuery,
        },
        onSearch: (values) => {
            return [
                {
                    field: 'name',
                    operator: 'contains',
                    value: values.name,
                },
            ];
        },
    });

    const { mutate } = useUpdate({
        dataProviderName: 'graphql',
        resource: 'triggerCrawler',
    });

    const triggerCrawler = (name: string) => {
        if (!name) return;

        mutate({
            dataProviderName: 'graphql',
            resource: 'triggerCrawler',
            id: name,
            meta: {
                gqlQuery: MNT_TRIGGER_CRAWLER,
                gqlMutation: MNT_TRIGGER_CRAWLER,
                variables: {
                    input: {
                        name: name,
                    } satisfies TriggerCrawlerInput,
                },
            },
            successNotification: {
                message: 'Crawler Triggered',
                description: `${name} crawler has been triggered successfully`,
                type: 'success',
            },
            values: {},
        });
    };

    // Calculate statistics from table data
    const records = tableProps.dataSource || [];
    const enabledCount = records.filter((record) => record.enabled).length;
    const disabledCount = records.length - enabledCount;

    return (
        <div style={{ padding: '0 24px' }}>
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card bordered={false}>
                        <Title level={3}>Crawler Management</Title>
                        <Paragraph>
                            This interface allows you to manage existing crawler settings. You can
                            update settings, enable/disable, or trigger crawlers manually.
                        </Paragraph>
                        <Alert
                            message="Managing Crawler Sources"
                            description="The system only supports editing existing crawler sources. Creating new sources or removing existing ones requires changes to the codebase."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card>
                        <Row gutter={[32, 16]} align="middle">
                            <Col xs={24} sm={24} md={12} lg={12}>
                                <Title level={3} style={{ margin: 0 }}>
                                    Crawler Settings
                                </Title>
                                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                                    Manage movie data crawlers configuration and scheduling
                                </Paragraph>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Statistics Cards */}
                <Col xs={24} sm={12} md={8} lg={8}>
                    <Card>
                        <Statistic
                            title="Total Crawlers"
                            value={records.length}
                            prefix={<SettingOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8}>
                    <Card>
                        <Statistic
                            title="Active Crawlers"
                            value={enabledCount}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<PlayCircleOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8} lg={8}>
                    <Card>
                        <Statistic
                            title="Disabled Crawlers"
                            value={disabledCount}
                            valueStyle={{ color: '#ff4d4f' }}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>

                {/* Search Card */}
                <Col span={24}>
                    <Card bordered={false}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 16,
                            }}
                        >
                            <Form {...searchFormProps} layout="inline">
                                <Form.Item name="name">
                                    <Input
                                        placeholder="Search by name"
                                        prefix={<SearchOutlined />}
                                        allowClear
                                    />
                                </Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Search
                                </Button>
                            </Form>
                        </div>
                    </Card>
                </Col>

                {/* Table Card */}
                <Col span={24}>
                    <Card bodyStyle={{ padding: 0 }}>
                        <Table
                            {...tableProps}
                            rowKey="_id"
                            pagination={{
                                ...tableProps.pagination,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                showTotal: (total) => `Total ${total} items`,
                            }}
                        >
                            <Table.Column
                                dataIndex="name"
                                title="Name"
                                render={(value) => <strong>{value}</strong>}
                                sorter={(a: CrawlerSettingsRecord, b: CrawlerSettingsRecord) =>
                                    a.name.localeCompare(b.name)
                                }
                            />
                            <Table.Column
                                dataIndex="host"
                                title="Host"
                                render={(value) => (
                                    <a href={value} target="_blank" rel="noopener noreferrer">
                                        {value}
                                    </a>
                                )}
                                ellipsis
                            />
                            <Table.Column
                                dataIndex="cronSchedule"
                                title="Schedule"
                                render={(value) => (
                                    <Tooltip title="Cron schedule expression">
                                        <Tag icon={<ClockCircleOutlined />} color="blue">
                                            {value}
                                        </Tag>
                                    </Tooltip>
                                )}
                            />
                            <Table.Column
                                dataIndex="enabled"
                                title="Status"
                                render={(value) =>
                                    value ? (
                                        <Badge status="success" text="Enabled" />
                                    ) : (
                                        <Badge status="error" text="Disabled" />
                                    )
                                }
                                filters={[
                                    { text: 'Enabled', value: true },
                                    { text: 'Disabled', value: false },
                                ]}
                                onFilter={(value, record: CrawlerSettingsRecord) =>
                                    record.enabled === value
                                }
                            />
                            <Table.Column
                                dataIndex="forceUpdate"
                                title="Force Update"
                                render={(value) =>
                                    value ? (
                                        <Tag color="orange">Yes</Tag>
                                    ) : (
                                        <Tag color="default">No</Tag>
                                    )
                                }
                            />
                            <Table.Column
                                dataIndex="updatedAt"
                                title="Last Updated"
                                render={(value) => <DateField value={value} format="LLL" />}
                                sorter={(a: CrawlerSettingsRecord, b: CrawlerSettingsRecord) => {
                                    const dateA = new Date(a.updatedAt).getTime();
                                    const dateB = new Date(b.updatedAt).getTime();
                                    return dateA - dateB;
                                }}
                            />
                            <Table.Column
                                title="Actions"
                                dataIndex="actions"
                                render={(_, record: CrawlerSettingsRecord) => (
                                    <Space>
                                        <EditButton
                                            hideText
                                            size="middle"
                                            recordItemId={record._id}
                                            type="primary"
                                            ghost
                                        />
                                        <ShowButton
                                            hideText
                                            size="middle"
                                            recordItemId={record._id}
                                        />
                                        <DeleteButton
                                            hideText
                                            size="middle"
                                            recordItemId={record._id}
                                            meta={{
                                                gqlMutation: gqlDeleteMutation,
                                            }}
                                        />
                                        <Tooltip title="Trigger Crawler">
                                            <Button
                                                icon={<PlayCircleOutlined />}
                                                size="middle"
                                                onClick={() => triggerCrawler(record.name)}
                                                type="primary"
                                                disabled={!record.enabled}
                                            />
                                        </Tooltip>
                                    </Space>
                                )}
                            />
                        </Table>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
