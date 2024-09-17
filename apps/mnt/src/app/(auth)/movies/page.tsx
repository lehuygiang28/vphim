'use client';

import React from 'react';
import {
    useTable,
    List,
    EditButton,
    ShowButton,
    DeleteButton,
    getDefaultSortOrder,
    FilterDropdown,
    DateField,
} from '@refinedev/antd';
import { CrudFilters } from '@refinedev/core';
import { Table, Space, Tag, Input, Select, Form, Image as AntImage } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { MovieType } from '~api/app/movies/movie.type';
import { MNT_MOVIE_LIST_QUERY } from '~mnt/queries/movie.query';
import Link from 'next/link';

const { Option } = Select;

export default function MovieListPage() {
    const { tableProps, searchFormProps, sorters, setFilters } = useTable<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: {
            gqlQuery: MNT_MOVIE_LIST_QUERY,
        },
        filters: {
            mode: 'server',
            defaultBehavior: 'replace',
            initial: [],
        },
        pagination: {
            mode: 'server',
            current: 1,
            pageSize: 24,
        },
        sorters: {
            mode: 'server',
            initial: [{ field: 'updatedAt', order: 'desc' }],
        },
        onSearch: (params) => {
            const filters: CrudFilters = [];
            const { keywords } = params as any;

            if (keywords) {
                filters.push({
                    field: 'keywords',
                    operator: 'contains',
                    value: keywords,
                });
            }

            return setFilters(filters);
        },
        syncWithLocation: true,
    });

    return (
        <List>
            <Form {...searchFormProps} layout="vertical">
                <Form.Item name="keywords">
                    <Input
                        placeholder="Search keywords"
                        prefix={<SearchOutlined />}
                        style={{ marginBottom: 16 }}
                    />
                </Form.Item>
            </Form>
            <Table<MovieType>
                {...tableProps}
                rowKey="_id"
                pagination={{
                    ...tableProps.pagination,
                    showSizeChanger: true,
                }}
                size="small"
                columns={[
                    {
                        title: 'Thumb',
                        render: (movie?: MovieType) => {
                            const { thumbUrl, originName } = movie || {};
                            return (
                                <AntImage
                                    src={thumbUrl || '/placeholder.png'}
                                    alt={originName || 'thumb image'}
                                    width={40}
                                    height={60}
                                    preview={{
                                        src: thumbUrl || '/placeholder.png',
                                        mask: 'Preview',
                                    }}
                                />
                            );
                        },
                    },
                    {
                        title: 'Name',
                        dataIndex: 'name',
                        sorter: { multiple: 1 },
                        defaultSortOrder: getDefaultSortOrder('name', sorters),
                        filterDropdown: (props) => (
                            <Input
                                {...props}
                                placeholder="Search name"
                                prefix={<SearchOutlined />}
                            />
                        ),
                    },
                    {
                        title: 'Type',
                        dataIndex: 'type',
                        sorter: { multiple: 2 },
                        defaultSortOrder: getDefaultSortOrder('type', sorters),
                        filters: [
                            { text: 'Movie', value: 'movie' },
                            { text: 'Series', value: 'series' },
                        ],
                        filterDropdown: (props) => (
                            <FilterDropdown {...props}>
                                <Select style={{ width: 120 }} {...props} placeholder="Select type">
                                    <Option value="movie">Movie</Option>
                                    <Option value="series">Series</Option>
                                </Select>
                            </FilterDropdown>
                        ),
                    },
                    {
                        title: 'Year',
                        dataIndex: 'year',
                        sorter: { multiple: 3 },
                        defaultSortOrder: getDefaultSortOrder('year', sorters),
                    },
                    {
                        title: 'Status',
                        dataIndex: 'status',
                        sorter: { multiple: 4 },
                        defaultSortOrder: getDefaultSortOrder('status', sorters),
                        render: (status: string) => (
                            <Tag color={status === 'completed' ? 'green' : 'orange'}>{status}</Tag>
                        ),
                        filters: [
                            { text: 'Completed', value: 'completed' },
                            { text: 'Ongoing', value: 'ongoing' },
                            { text: 'Trailer', value: 'trailer' },
                        ],
                        filterDropdown: (props) => (
                            <FilterDropdown {...props}>
                                <Select
                                    style={{ width: 120 }}
                                    {...props}
                                    placeholder="Select status"
                                >
                                    <Option value="completed">Completed</Option>
                                    <Option value="ongoing">Ongoing</Option>
                                    <Option value="trailer">Trailer</Option>
                                </Select>
                            </FilterDropdown>
                        ),
                    },
                    {
                        title: 'Imdb',
                        dataIndex: ['imdb', 'id'],
                        sorter: { multiple: 5 },
                        defaultSortOrder: getDefaultSortOrder('imdb.id', sorters),
                        render: (id?: number) => (
                            <>
                                {id ? (
                                    <Link
                                        href={`https://www.imdb.com/title/${id}`}
                                        target="_blank"
                                        referrerPolicy="no-referrer"
                                    >
                                        {id}
                                    </Link>
                                ) : (
                                    'N/A'
                                )}
                            </>
                        ),
                    },
                    {
                        title: 'Tmdb',
                        dataIndex: ['tmdb'],
                        sorter: { multiple: 6 },
                        defaultSortOrder: getDefaultSortOrder('tmdb.id', sorters),
                        render: (tmdb?: { id: string; type: string }) => {
                            const { id = null, type = null } = tmdb || {};
                            return (
                                <>
                                    {id && type ? (
                                        <Link
                                            href={`https://www.themoviedb.org/${type}/${id}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                        >
                                            {id}
                                        </Link>
                                    ) : (
                                        'N/A'
                                    )}
                                </>
                            );
                        },
                    },
                    {
                        title: 'Views',
                        dataIndex: 'view',
                        sorter: { multiple: 7 },
                        defaultSortOrder: getDefaultSortOrder('view', sorters),
                    },
                    {
                        title: 'Last Update',
                        dataIndex: 'updatedAt',
                        sorter: { multiple: 8 },
                        defaultSortOrder: getDefaultSortOrder('updatedAt', sorters),
                        render: (date: string) => <DateField value={date} format="H:m D/M/YY" />,
                    },
                    {
                        title: 'Actions',
                        dataIndex: 'actions',
                        render: (_, record) => (
                            <Space>
                                <EditButton hideText size="small" recordItemId={record.slug} />
                                <ShowButton hideText size="small" recordItemId={record.slug} />
                                <DeleteButton hideText size="small" recordItemId={record.slug} />
                            </Space>
                        ),
                    },
                ]}
            />
        </List>
    );
}
