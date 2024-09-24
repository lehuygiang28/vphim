'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    useTable,
    List,
    EditButton,
    ShowButton,
    getDefaultSortOrder,
    DateField,
} from '@refinedev/antd';
import { CrudFilters, LogicalFilter } from '@refinedev/core';
import {
    Table,
    Space,
    Tag,
    Input,
    Select,
    Form,
    Image as AntImage,
    Button,
    Typography,
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';
import { MovieType } from '~api/app/movies/movie.type';
import { MNT_MOVIE_LIST_QUERY, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';
import Link from 'next/link';
import { RestoreButton } from '../button/restore-button';
import { DeleteMovieButton } from '../button/delete-movie-button';
import { RefreshMovieButton } from '../button/refresh-movie-button';
import { useRouter } from 'next/navigation';

const { Text } = Typography;
const { Option } = Select;

export type MovieTableMntProps = {
    type: 'show' | 'recycle-bin';
};

export default function MovieTableMnt({ type }: MovieTableMntProps) {
    const router = useRouter();
    const [yearPickerType, setYearPickerType] = useState<'multiple' | 'range'>('multiple');

    const { tableProps, searchFormProps, sorters, filters, setFilters } = useTable<MovieType>({
        resource: 'movies',
        dataProviderName: 'graphql',
        meta: {
            gqlQuery: MNT_MOVIE_LIST_QUERY,
            operation: 'moviesForAdmin',
            resetCache: true,
            bypassCache: true,
        },
        filters: {
            mode: 'server',
            defaultBehavior: 'merge',
            ...(type === 'recycle-bin'
                ? {
                      permanent: [
                          {
                              field: 'isDeleted',
                              operator: 'eq',
                              value: true,
                          },
                      ],
                  }
                : {}),
        },
        sorters: {
            mode: 'server',
            initial: [{ field: 'updatedAt', order: 'desc' }],
        },
        pagination: {
            mode: 'server',
            current: 1,
            pageSize: 24,
        },
    });

    const handleYearPickerTypeChange = useCallback(
        (value: 'multiple' | 'range') => {
            setYearPickerType(value);
            searchFormProps.form?.setFieldsValue({ years: undefined });
        },
        [searchFormProps.form],
    );

    const handleYearChange = useCallback(
        (value: number | null, type: 'start' | 'end') => {
            const form = searchFormProps.form;
            if (!form) return;

            const [startYear, endYear] = form.getFieldValue('years') || [];

            if (type === 'start' && value !== null) {
                if (endYear && value > endYear) {
                    form.setFieldsValue({ years: [value, null] });
                } else {
                    form.setFieldsValue({ years: [value, endYear] });
                }
            } else if (type === 'end' && value !== null) {
                if (startYear && value < startYear) {
                    form.setFieldsValue({ years: [null, value] });
                } else {
                    form.setFieldsValue({ years: [startYear, value] });
                }
            }
        },
        [searchFormProps.form],
    );

    const handleFinishSearchForm = (params: Record<string, unknown>) => {
        const filters: CrudFilters = [];
        const { keywords, type, status, years } = params ?? {};

        if (keywords) {
            filters.push({
                field: 'keywords',
                operator: 'contains',
                value: keywords,
            });
        }

        if (type) {
            filters.push({
                field: 'type',
                operator: 'eq',
                value: type,
            });
        }

        if (status) {
            filters.push({
                field: 'status',
                operator: 'eq',
                value: status,
            });
        }

        if (years) {
            let yearValue: string;
            if (Array.isArray(years)) {
                if (yearPickerType === 'multiple') {
                    yearValue = years.join(',');
                } else {
                    const [startYear, endYear] = years;
                    yearValue = `${startYear}-${endYear}`;
                }
            } else {
                yearValue = years.toString();
            }
            if (yearValue && yearValue !== '-' && yearValue !== ',') {
                filters.push({
                    field: 'years',
                    operator: 'eq',
                    value: yearValue,
                });
            }
        }

        return setFilters(filters, 'replace');
    };

    useEffect(() => {
        const yearFilter = filters.find((filter) => (filter as LogicalFilter).field === 'years');
        if (yearFilter && yearFilter.value) {
            let yearValue: number[];
            if (typeof yearFilter.value === 'string') {
                if (yearFilter.value.includes('-')) {
                    setYearPickerType('range');
                    const [startYear, endYear] = yearFilter.value.split('-');
                    yearValue = [parseInt(startYear), parseInt(endYear)];
                } else if (yearFilter.value.includes(',')) {
                    setYearPickerType('multiple');
                    yearValue = yearFilter.value.split(',').map(Number);
                } else {
                    setYearPickerType('multiple');
                    yearValue = [parseInt(yearFilter.value)];
                }
                searchFormProps.form?.setFieldsValue({ years: yearValue });
            }
        }
    }, [filters, searchFormProps.form]);

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

    return (
        <List
            headerButtons={({ defaultButtons }) => {
                return <RefreshMovieButton resource="movies" dataProviderName="graphql" />;
            }}
        >
            <Form {...searchFormProps} layout="vertical" onFinish={handleFinishSearchForm}>
                <Space wrap>
                    <Form.Item name="keywords">
                        <Input placeholder="Search keywords" prefix={<SearchOutlined />} />
                    </Form.Item>
                    <Form.Item name="type">
                        <Select style={{ width: 120 }} placeholder="Select type">
                            <Option value="movie">Movie</Option>
                            <Option value="series">Series</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="status">
                        <Select style={{ width: 120 }} placeholder="Select status">
                            <Option value="completed">Completed</Option>
                            <Option value="ongoing">Ongoing</Option>
                            <Option value="trailer">Trailer</Option>
                        </Select>
                    </Form.Item>
                    <Space style={{ marginLeft: '1rem' }}>
                        <Form.Item>
                            <Select
                                style={{ width: 150 }}
                                placeholder="Select year type"
                                onChange={handleYearPickerTypeChange}
                                value={yearPickerType}
                            >
                                <Option value="multiple">Multiple Years</Option>
                                <Option value="range">Year Range</Option>
                            </Select>
                        </Form.Item>
                        {yearPickerType === 'range' ? (
                            <Space>
                                <Form.Item>From</Form.Item>
                                <Form.Item name={['years', 0]}>
                                    <Select
                                        style={{ width: 100 }}
                                        placeholder="Start Year"
                                        onChange={(value) => handleYearChange(value, 'start')}
                                        allowClear
                                    >
                                        {yearOptions.map((year) => (
                                            <Option key={year} value={year}>
                                                {year}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item>to</Form.Item>
                                <Form.Item name={['years', 1]}>
                                    <Select
                                        style={{ width: 100 }}
                                        placeholder="End Year"
                                        onChange={(value) => handleYearChange(value, 'end')}
                                        allowClear
                                    >
                                        {yearOptions.map((year) => (
                                            <Option key={year} value={year}>
                                                {year}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Space>
                        ) : (
                            <Form.Item name="years">
                                <Select
                                    mode="multiple"
                                    style={{ width: 300 }}
                                    placeholder="Select years"
                                    tokenSeparators={[',']}
                                    allowClear
                                >
                                    {yearOptions.map((year) => (
                                        <Option key={year} value={year}>
                                            {year}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                    </Space>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Search
                        </Button>
                    </Form.Item>
                </Space>
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
                        title: 'No.',
                        render: (_, __, index) => {
                            if (!tableProps.pagination) return index + 1;
                            const { current, pageSize } = tableProps.pagination || {};
                            return (current - 1) * pageSize + index + 1;
                        },
                    },
                    {
                        title: 'Thumb',
                        render: (movie?: MovieType) => {
                            const { thumbUrl, originName } = movie || {};
                            return (
                                <AntImage
                                    src={getOptimizedImageUrl(thumbUrl, {
                                        width: 40,
                                        height: 60,
                                    })}
                                    alt={originName || 'thumb image'}
                                    width={40}
                                    height={60}
                                    preview={false}
                                    onClick={() => router.push(`/movies/show/${movie?._id}`)}
                                    style={{ cursor: 'pointer' }}
                                />
                            );
                        },
                    },
                    {
                        title: 'Name',
                        dataIndex: 'name',
                        render: (name: string, record: MovieType) => (
                            <Space direction="vertical" size={0}>
                                {name}
                                {record.originName && (
                                    <Text type="secondary">{record.originName}</Text>
                                )}
                            </Space>
                        ),
                    },
                    {
                        title: 'Type',
                        dataIndex: 'type',
                    },
                    {
                        title: 'Year',
                        dataIndex: 'year',
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('year', sorters),
                    },
                    {
                        title: 'Status',
                        dataIndex: 'status',
                        render: (status: string) => (
                            <Tag color={status === 'completed' ? 'green' : 'orange'}>{status}</Tag>
                        ),
                    },
                    {
                        title: 'Current',
                        dataIndex: ['episodeCurrent'],
                        render: (episodeCurrent: string) => <>{episodeCurrent.toLowerCase()}</>,
                    },
                    {
                        title: 'Views',
                        dataIndex: 'view',
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('view', sorters),
                    },
                    {
                        title: 'Last Update',
                        dataIndex: 'updatedAt',
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('updatedAt', sorters),
                        render: (date: string) => (
                            <DateField value={new Date(date)} format="H:m D/M/YY" />
                        ),
                    },
                    {
                        title: 'Actions',
                        dataIndex: 'actions',
                        render: (_, record) => {
                            if (type === 'show') {
                                return (
                                    <Space>
                                        <EditButton
                                            hideText
                                            size="small"
                                            recordItemId={record._id?.toString()}
                                        />
                                        <ShowButton
                                            hideText
                                            size="small"
                                            recordItemId={record._id?.toString()}
                                        />
                                        <DeleteMovieButton
                                            id={record._id?.toString()}
                                            type="soft-delete"
                                            deleteButtonProps={{
                                                hideText: true,
                                                size: 'small',
                                            }}
                                        />
                                    </Space>
                                );
                            } else {
                                return (
                                    <Space>
                                        <RestoreButton
                                            name="movie"
                                            mutateParam={{
                                                resource: 'movies',
                                                id: record._id?.toString(),
                                                meta: {
                                                    gqlMutation: MUTATION_UPDATE_MOVIE,
                                                    operation: 'updateMovie',
                                                    variables: {
                                                        input: {
                                                            _id: record._id?.toString(),
                                                            deletedAt: 'restore',
                                                        },
                                                    },
                                                },
                                                variables: {},
                                            }}
                                        />
                                        <DeleteMovieButton
                                            id={record._id?.toString()}
                                            type="hard-delete"
                                            deleteButtonProps={{
                                                hideText: true,
                                                size: 'small',
                                            }}
                                        />
                                    </Space>
                                );
                            }
                        },
                    },
                ]}
            />
        </List>
    );
}
