'use client';

import React, { useState } from 'react';
import { Card, Button, Form, Input, Popconfirm, Space, Table, Typography } from 'antd';
import {
    PlusOutlined,
    MinusCircleOutlined,
    QuestionCircleOutlined,
    SearchOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { EpisodeModal } from './episode-modal';
import { ServerOriginSrcTag } from '../tag/server-origin-src-tag';

const { Title } = Typography;

export const ServerEpisodeSection = ({ form }) => {
    const [isEpisodeModalVisible, setIsEpisodeModalVisible] = useState(false);
    const [currentServerIndex, setCurrentServerIndex] = useState<number | null>(null);
    const [currentServerName, setCurrentServerName] = useState<string>('');
    const [serverPaginations, setServerPaginations] = useState<{
        [key: number]: { current: number; pageSize: number };
    }>({});

    const showEpisodeModal = (serverIndex: number) => {
        const serverName =
            form.getFieldValue(['episode', serverIndex, 'serverName']) ||
            `Server ${serverIndex + 1}`;
        setCurrentServerIndex(serverIndex);
        setCurrentServerName(serverName);
        setIsEpisodeModalVisible(true);
    };

    const handleEpisodeModalClose = () => {
        setIsEpisodeModalVisible(false);
        setCurrentServerIndex(null);
        setCurrentServerName('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getColumnSearchProps = (dataIndex: string): ColumnType<any> => ({
        filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
        }: FilterDropdownProps) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && clearFilters()}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                ? record[dataIndex]
                      .toString()
                      .toLowerCase()
                      .includes((value as string).toLowerCase())
                : '',
    });

    const handleTableChange = (pagination, filters, sorter, extra) => {
        const { current, pageSize } = pagination;
        const { currentDataSource } = extra;
        const serverIndex = currentDataSource[0]?.serverIndex;

        setServerPaginations((prev) => ({
            ...prev,
            [serverIndex]: { current, pageSize },
        }));
    };

    const moveEpisode = (serverIndex: number, fromIndex: number, toIndex: number) => {
        const episodes = form.getFieldValue(['episode', serverIndex, 'serverData']) || [];
        const newEpisodes = [...episodes];
        const [movedEpisode] = newEpisodes.splice(fromIndex, 1);
        newEpisodes.splice(toIndex, 0, movedEpisode);
        form.setFieldValue(['episode', serverIndex, 'serverData'], newEpisodes);
    };

    const moveServer = (fromIndex: number, toIndex: number) => {
        const servers = form.getFieldValue('episode') || [];
        const newServers = [...servers];
        const [movedServer] = newServers.splice(fromIndex, 1);
        newServers.splice(toIndex, 0, movedServer);
        form.setFieldValue('episode', newServers);
    };

    return (
        <>
            <Form.List name="episode">
                {(fields, { add, remove, move }) => (
                    <>
                        {fields.map((field, index) => (
                            <Card
                                key={field.key}
                                title={
                                    <Space>
                                        <Title level={5}>No. {index + 1}</Title>
                                        <Form.Item
                                            {...field}
                                            name={[field.name, 'serverName']}
                                            rules={[
                                                {
                                                    required: true,
                                                    message: 'Server name is required',
                                                },
                                            ]}
                                            style={{ margin: 0 }}
                                        >
                                            <Input placeholder="Server Name" />
                                        </Form.Item>
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prevValues, currentValues) =>
                                                prevValues.episode?.[index]?.serverName !==
                                                currentValues.episode?.[index]?.serverName
                                            }
                                        >
                                            {({ getFieldValue }) => {
                                                const originSrc = getFieldValue([
                                                    'episode',
                                                    index,
                                                    'originSrc',
                                                ]);
                                                return <ServerOriginSrcTag originSrc={originSrc} />;
                                            }}
                                        </Form.Item>
                                    </Space>
                                }
                                extra={
                                    <Space>
                                        <Button
                                            icon={<ArrowUpOutlined />}
                                            onClick={() =>
                                                moveServer(index, Math.max(0, index - 1))
                                            }
                                            disabled={index === 0}
                                        />
                                        <Button
                                            icon={<ArrowDownOutlined />}
                                            onClick={() => moveServer(index, index + 1)}
                                            disabled={index === fields.length - 1}
                                        />
                                        <Button
                                            onClick={() => showEpisodeModal(index)}
                                            icon={<PlusOutlined />}
                                        >
                                            Add Episode
                                        </Button>
                                        <Popconfirm
                                            title="Are you sure you want to delete this server?"
                                            onConfirm={() => remove(field.name)}
                                            okText="Yes"
                                            cancelText="No"
                                            icon={
                                                <QuestionCircleOutlined style={{ color: 'red' }} />
                                            }
                                        >
                                            <Button danger icon={<MinusCircleOutlined />}>
                                                Remove Server
                                            </Button>
                                        </Popconfirm>
                                    </Space>
                                }
                                style={{ marginBottom: 16 }}
                            >
                                <Form.List name={[field.name, 'serverData']}>
                                    {(subFields, { add: addEpisode, remove: removeEpisode }) => {
                                        const episodeData =
                                            form.getFieldValue([
                                                'episode',
                                                field.name,
                                                'serverData',
                                            ]) || [];

                                        const pagination = serverPaginations[index] || {
                                            current: 1,
                                            pageSize: 10,
                                        };
                                        const { current, pageSize } = pagination;
                                        const start = (current - 1) * pageSize;
                                        const end = start + pageSize;
                                        const paginatedData = episodeData
                                            .slice(start, end)
                                            .map((item, i) => ({
                                                ...item,
                                                serverIndex: index,
                                                episodeIndex: start + i,
                                            }));

                                        return (
                                            <Table
                                                dataSource={paginatedData}
                                                rowKey={(record) =>
                                                    `${field.name}-${record.episodeIndex}`
                                                }
                                                columns={[
                                                    {
                                                        title: 'Name',
                                                        dataIndex: 'name',
                                                        key: 'name',
                                                        ...getColumnSearchProps('name'),
                                                        render: (_, record) => (
                                                            <Form.Item
                                                                name={[record.episodeIndex, 'name']}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message:
                                                                            'Episode name is required',
                                                                    },
                                                                ]}
                                                                style={{ margin: 0 }}
                                                            >
                                                                <Input />
                                                            </Form.Item>
                                                        ),
                                                    },
                                                    {
                                                        title: 'Slug',
                                                        dataIndex: 'slug',
                                                        key: 'slug',
                                                        ...getColumnSearchProps('slug'),
                                                        render: (_, record) => (
                                                            <Form.Item
                                                                name={[record.episodeIndex, 'slug']}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message:
                                                                            'Episode slug is required',
                                                                    },
                                                                ]}
                                                                style={{ margin: 0 }}
                                                            >
                                                                <Input />
                                                            </Form.Item>
                                                        ),
                                                    },
                                                    {
                                                        title: 'M3U8 Link',
                                                        dataIndex: 'linkM3u8',
                                                        key: 'linkM3u8',
                                                        ...getColumnSearchProps('linkM3u8'),
                                                        render: (_, record) => (
                                                            <Form.Item
                                                                name={[
                                                                    record.episodeIndex,
                                                                    'linkM3u8',
                                                                ]}
                                                                style={{ margin: 0 }}
                                                            >
                                                                <Input />
                                                            </Form.Item>
                                                        ),
                                                    },
                                                    {
                                                        title: 'Embed Link',
                                                        dataIndex: 'linkEmbed',
                                                        key: 'linkEmbed',
                                                        ...getColumnSearchProps('linkEmbed'),
                                                        render: (_, record) => (
                                                            <Form.Item
                                                                name={[
                                                                    record.episodeIndex,
                                                                    'linkEmbed',
                                                                ]}
                                                                style={{ margin: 0 }}
                                                            >
                                                                <Input />
                                                            </Form.Item>
                                                        ),
                                                    },
                                                    {
                                                        title: 'Action',
                                                        key: 'action',
                                                        render: (_, record) => (
                                                            <Space>
                                                                <Button
                                                                    icon={<ArrowUpOutlined />}
                                                                    size="small"
                                                                    onClick={() =>
                                                                        moveEpisode(
                                                                            record.serverIndex,
                                                                            record.episodeIndex,
                                                                            Math.max(
                                                                                0,
                                                                                record.episodeIndex -
                                                                                    1,
                                                                            ),
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        record.episodeIndex === 0
                                                                    }
                                                                />
                                                                <Button
                                                                    icon={<ArrowDownOutlined />}
                                                                    size="small"
                                                                    onClick={() =>
                                                                        moveEpisode(
                                                                            record.serverIndex,
                                                                            record.episodeIndex,
                                                                            record.episodeIndex + 1,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        record.episodeIndex ===
                                                                        episodeData.length - 1
                                                                    }
                                                                />
                                                                <Popconfirm
                                                                    title="Are you sure you want to delete this episode?"
                                                                    onConfirm={() =>
                                                                        removeEpisode(
                                                                            record.episodeIndex,
                                                                        )
                                                                    }
                                                                    okText="Yes"
                                                                    cancelText="No"
                                                                    icon={
                                                                        <QuestionCircleOutlined
                                                                            style={{ color: 'red' }}
                                                                        />
                                                                    }
                                                                >
                                                                    <Button
                                                                        danger
                                                                        icon={
                                                                            <MinusCircleOutlined />
                                                                        }
                                                                        size="small"
                                                                    />
                                                                </Popconfirm>
                                                            </Space>
                                                        ),
                                                    },
                                                ]}
                                                pagination={{
                                                    ...pagination,
                                                    total: episodeData.length,
                                                    showSizeChanger: true,
                                                    showQuickJumper: true,
                                                }}
                                                onChange={handleTableChange}
                                            />
                                        );
                                    }}
                                </Form.List>
                            </Card>
                        ))}
                        <Form.Item>
                            <Button
                                type="dashed"
                                onClick={() => add()}
                                block
                                icon={<PlusOutlined />}
                            >
                                Add Server
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
            <EpisodeModal
                visible={isEpisodeModalVisible}
                onClose={handleEpisodeModalClose}
                form={form}
                serverIndex={currentServerIndex}
                serverName={currentServerName}
            />
        </>
    );
};
