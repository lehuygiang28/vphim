'use client';

import React, { useState } from 'react';
import { Card, Button, Form, Input, Popconfirm, Space, Table, Typography } from 'antd';
import {
    PlusOutlined,
    MinusCircleOutlined,
    QuestionCircleOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { ColumnType } from 'antd/es/table';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { EpisodeModal } from './episode-modal';

const { Title } = Typography;

export const ServerEpisodeSection = ({ form }) => {
    const [isEpisodeModalVisible, setIsEpisodeModalVisible] = useState(false);
    const [currentServerIndex, setCurrentServerIndex] = useState<number | null>(null);
    const [currentServerName, setCurrentServerName] = useState<string>('');
    const [searchText, setSearchText] = useState('');
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

    const handleSearch = (selectedKeys: React.Key[], confirm: () => void) => {
        confirm();
        setSearchText(selectedKeys[0] as string);
    };

    const handleReset = (clearFilters: () => void) => {
        clearFilters();
        setSearchText('');
    };

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
                    onPressEnter={() => handleSearch(selectedKeys as React.Key[], confirm)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys as React.Key[], confirm)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
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

    return (
        <>
            <Form.List name="episode">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map((field, index) => (
                            <Card
                                key={field.key}
                                title={
                                    <Space>
                                        <Title level={5}>Server {index + 1}</Title>
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
                                    </Space>
                                }
                                extra={
                                    <Space>
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
                                            .map((item) => ({
                                                ...item,
                                                serverIndex: index,
                                            }));

                                        return (
                                            <Table
                                                dataSource={paginatedData}
                                                rowKey={(record, index) =>
                                                    `${field.name}-${start + index}`
                                                }
                                                columns={[
                                                    {
                                                        title: 'Name',
                                                        dataIndex: 'name',
                                                        key: 'name',
                                                        ...getColumnSearchProps('name'),
                                                        render: (_, __, index) => (
                                                            <Form.Item
                                                                name={[start + index, 'name']}
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
                                                        render: (_, __, index) => (
                                                            <Form.Item
                                                                name={[start + index, 'slug']}
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
                                                        render: (_, __, index) => (
                                                            <Form.Item
                                                                name={[start + index, 'linkM3u8']}
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
                                                        render: (_, __, index) => (
                                                            <Form.Item
                                                                name={[start + index, 'linkEmbed']}
                                                                style={{ margin: 0 }}
                                                            >
                                                                <Input />
                                                            </Form.Item>
                                                        ),
                                                    },
                                                    {
                                                        title: 'Action',
                                                        key: 'action',
                                                        render: (_, __, index) => (
                                                            <Popconfirm
                                                                title="Are you sure you want to delete this episode?"
                                                                onConfirm={() =>
                                                                    removeEpisode(start + index)
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
                                                                    icon={<MinusCircleOutlined />}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </Popconfirm>
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
