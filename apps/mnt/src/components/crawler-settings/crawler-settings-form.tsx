'use client';

import React from 'react';
import {
    Form,
    Input,
    InputNumber,
    Button,
    Switch,
    Row,
    Col,
    Card,
    Alert,
    Space,
    Typography,
    Divider,
    Tabs,
    Tooltip,
} from 'antd';
import { useForm } from '@refinedev/antd';
import { HttpError } from '@refinedev/core';
import {
    InfoCircleOutlined,
    ScheduleOutlined,
    LinkOutlined,
    SettingOutlined,
    SaveOutlined,
    CloseOutlined,
    GlobalOutlined,
    CodeOutlined,
    FieldTimeOutlined,
    SyncOutlined,
    RetweetOutlined,
} from '@ant-design/icons';
import { DocumentNode } from 'graphql';
import {
    CrawlerSettingsFormData,
    CrawlerSettingsEditFormData,
} from '~mnt/types/crawler-settings.types';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface CrawlerSettingsFormProps {
    action: 'create' | 'edit';
    redirect: false | 'create' | 'edit' | 'list' | 'show';
    id?: string;
    mutation: DocumentNode;
    query?: DocumentNode;
}

export const CrawlerSettingsForm: React.FC<CrawlerSettingsFormProps> = ({
    action,
    redirect,
    id,
    mutation,
    query,
}) => {
    const { formProps, saveButtonProps, formLoading, onFinish } = useForm<
        CrawlerSettingsFormData,
        HttpError,
        CrawlerSettingsEditFormData
    >({
        action,
        id,
        resource: 'crawlerSettings',
        dataProviderName: 'graphql',
        meta: {
            gqlMutation: mutation,
            gqlQuery: query,
            variables: {
                input: {
                    _id: id,
                },
            },
        },
        redirect,
        warnWhenUnsavedChanges: true,
    });

    // Redirect to list if action is create since we don't allow creation
    if (action === 'create') {
        if (typeof window !== 'undefined') {
            window.location.href = '/crawler-settings';
        }
        return (
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
                <Card bordered={false}>
                    <Title level={3}>Feature Not Available</Title>
                    <Paragraph>
                        Creating new crawler sources is not supported through the UI. New crawler
                        sources must be added directly to the codebase.
                    </Paragraph>
                    <Alert
                        message="Operation Not Permitted"
                        description="The system only allows editing existing crawler sources. Adding new sources requires code changes."
                        type="warning"
                        showIcon
                        style={{ marginTop: 16 }}
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            window.location.href = '/crawler-settings';
                        }}
                        style={{ marginTop: 16 }}
                    >
                        Return to Crawler List
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
            <Card bordered={false} style={{ marginBottom: 24 }}>
                <Title level={3}>Edit Crawler Settings</Title>
                <Paragraph type="secondary">
                    Modify the configuration for this crawler to optimize its performance and
                    behavior
                </Paragraph>
                <Alert
                    message="Changes will take effect on the next crawler run"
                    description="Any modifications will be applied when the crawler is next triggered manually or by schedule."
                    type="info"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            </Card>

            <Form
                {...formProps}
                layout="vertical"
                onFinish={async (values) => {
                    if (onFinish) {
                        await onFinish(values);
                    }
                }}
                disabled={formLoading}
            >
                <Tabs defaultActiveKey="basic" type="card">
                    <TabPane
                        tab={
                            <span>
                                <SettingOutlined /> Basic Settings
                            </span>
                        }
                        key="basic"
                    >
                        <Card bordered={false}>
                            <Row gutter={[32, 0]} align="top">
                                <Col xs={24} sm={24} md={12}>
                                    <Form.Item
                                        label={
                                            <Space>
                                                <CodeOutlined />
                                                <span>Crawler Name</span>
                                            </Space>
                                        }
                                        name="name"
                                        rules={[{ required: true, message: 'Name is required' }]}
                                        tooltip="Unique identifier for this crawler (e.g. ophim, kkphim, nguonc)"
                                        extra="This will be used as the unique identifier for this crawler"
                                    >
                                        <Input
                                            placeholder="Enter a unique name"
                                            suffix={<InfoCircleOutlined />}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={24} md={12}>
                                    <Form.Item
                                        label={
                                            <Space>
                                                <GlobalOutlined />
                                                <span>Host URL</span>
                                            </Space>
                                        }
                                        name="host"
                                        rules={[
                                            { required: true, message: 'Host URL is required' },
                                            { type: 'url', message: 'Please enter a valid URL' },
                                        ]}
                                        tooltip="Base URL for the crawler target website"
                                        extra="Example: https://example.com"
                                    >
                                        <Input
                                            placeholder="https://example.com"
                                            addonBefore="https://"
                                            suffix={<LinkOutlined />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={[32, 0]}>
                                <Col xs={24} sm={24} md={12}>
                                    <Form.Item
                                        label={
                                            <Space>
                                                <ScheduleOutlined />
                                                <span>Cron Schedule</span>
                                            </Space>
                                        }
                                        name="cronSchedule"
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Cron schedule is required',
                                            },
                                        ]}
                                        tooltip="Cron expression for scheduling (e.g. '0 0 * * *' for daily at midnight)"
                                        extra="Format: minute hour day-of-month month day-of-week"
                                    >
                                        <Input
                                            placeholder="0 0 * * *"
                                            suffix={<FieldTimeOutlined />}
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={24} md={12}>
                                    <Form.Item
                                        label={
                                            <Space>
                                                <LinkOutlined />
                                                <span>Image Host</span>
                                            </Space>
                                        }
                                        name="imgHost"
                                        tooltip="Base URL for serving images (optional)"
                                        extra="Leave empty to use the default host"
                                    >
                                        <Input
                                            placeholder="https://images.example.com"
                                            suffix={<LinkOutlined />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider dashed />

                            <Row gutter={[32, 0]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="enabled"
                                        valuePropName="checked"
                                        initialValue={true}
                                    >
                                        <Tooltip title="Whether this crawler should run on schedule">
                                            <Switch
                                                checkedChildren="Enabled"
                                                unCheckedChildren="Disabled"
                                            />
                                        </Tooltip>
                                    </Form.Item>
                                    <Text type="secondary">
                                        <InfoCircleOutlined style={{ marginRight: 8 }} />
                                        Enable or disable automated crawler execution
                                    </Text>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="forceUpdate"
                                        valuePropName="checked"
                                        initialValue={false}
                                    >
                                        <Tooltip title="Whether to update existing records">
                                            <Switch
                                                checkedChildren="Force Update"
                                                unCheckedChildren="Skip Existing"
                                            />
                                        </Tooltip>
                                    </Form.Item>
                                    <Text type="secondary">
                                        <SyncOutlined style={{ marginRight: 8 }} />
                                        Update existing items or skip to reduce processing time
                                    </Text>
                                </Col>
                            </Row>
                        </Card>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <RetweetOutlined /> Advanced Settings
                            </span>
                        }
                        key="advanced"
                    >
                        <Card bordered={false}>
                            <Alert
                                message="Performance Configuration"
                                description="These settings affect the crawler's performance and behavior. Adjust carefully based on the target site's capabilities."
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />

                            <Row gutter={[32, 16]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Max Retries"
                                        name="maxRetries"
                                        tooltip="Maximum number of retry attempts for failed requests"
                                        initialValue={3}
                                    >
                                        <InputNumber
                                            min={0}
                                            max={10}
                                            style={{ width: '100%' }}
                                            placeholder="3"
                                        />
                                    </Form.Item>
                                    <Text type="secondary">
                                        How many times to retry failed requests before giving up
                                    </Text>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Rate Limit Delay (ms)"
                                        name="rateLimitDelay"
                                        tooltip="Delay between requests in milliseconds to avoid rate limiting"
                                        initialValue={1000}
                                    >
                                        <InputNumber
                                            step={100}
                                            formatter={(value) => `${value} ms`}
                                            parser={(value) =>
                                                parseInt(value!.replace(' ms', ''), 10)
                                            }
                                            style={{ width: '100%' }}
                                            placeholder="1000"
                                        />
                                    </Form.Item>
                                    <Text type="secondary">
                                        Pause between requests to avoid being rate limited
                                    </Text>
                                </Col>
                            </Row>

                            <Row gutter={[32, 16]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Max Concurrent Requests"
                                        name="maxConcurrentRequests"
                                        tooltip="Maximum number of concurrent requests"
                                        initialValue={5}
                                    >
                                        <InputNumber
                                            min={1}
                                            max={20}
                                            style={{ width: '100%' }}
                                            placeholder="5"
                                        />
                                    </Form.Item>
                                    <Text type="secondary">
                                        Number of simultaneous connections to use
                                    </Text>
                                </Col>

                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label="Max Continuous Skips"
                                        name="maxContinuousSkips"
                                        tooltip="Maximum number of continuous skips before stopping"
                                        initialValue={50}
                                    >
                                        <InputNumber
                                            min={0}
                                            style={{ width: '100%' }}
                                            placeholder="50"
                                        />
                                    </Form.Item>
                                    <Text type="secondary">
                                        Stops crawling after this many consecutive items skipped
                                    </Text>
                                </Col>
                            </Row>
                        </Card>
                    </TabPane>
                </Tabs>

                <div
                    style={{
                        marginTop: 24,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '16px',
                    }}
                >
                    <Button
                        icon={<CloseOutlined />}
                        onClick={() => {
                            window.history.back();
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        {...saveButtonProps}
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={formLoading}
                    >
                        Save Changes
                    </Button>
                </div>
            </Form>
        </div>
    );
};
