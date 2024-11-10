'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTable, List, DateField, useSelect, getDefaultSortOrder } from '@refinedev/antd';
import { CrudFilters, LogicalFilter } from '@refinedev/core';
import { useDebouncedCallback } from 'use-debounce';
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
    Row,
    Col,
    Drawer,
    Checkbox,
    Card,
    Tooltip,
    Badge,
} from 'antd';
import {
    SearchOutlined,
    FilterOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';

import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';
import type { MovieType } from '~api/app/movies/movie.type';
import { MNT_MOVIE_LIST_QUERY, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';
import { RestoreButton } from '../button/restore-button';
import { DeleteMovieButton } from '../button/delete-movie-button';
import { RefreshMovieButton } from '../button/refresh-movie-button';
import { EditMovieButton } from '../button/edit-movie-button';
import { CATEGORIES_LIST_QUERY } from '@/queries/categories';
import { REGIONS_LIST_QUERY } from '@/queries/regions';
import { createRegex } from '@vn-utils/text';

const { Text } = Typography;
const { Option } = Select;

export type MovieTableMntProps = {
    type: 'show' | 'recycle-bin';
};

enum MovieStatus {
    ONGOING = 'ongoing',
    TRAILER = 'trailer',
    UPDATING = 'updating',
    COMPLETED = 'completed',
}

enum MovieTypeEnum {
    HOATHINH = 'hoathinh',
    TVSHOWS = 'tvshows',
    SERIES = 'series',
    SINGLE = 'single',
}

const statusOptions = [
    { value: MovieStatus.TRAILER, label: 'Trailer' },
    { value: MovieStatus.COMPLETED, label: 'Completed' },
    { value: MovieStatus.ONGOING, label: 'Ongoing' },
    { value: MovieStatus.UPDATING, label: 'Updating' },
];

const typeOptions = [
    { value: MovieTypeEnum.HOATHINH, label: 'Hoạt hình' },
    { value: MovieTypeEnum.TVSHOWS, label: 'TV Shows' },
    { value: MovieTypeEnum.SERIES, label: 'Series' },
    { value: MovieTypeEnum.SINGLE, label: 'Single' },
];

export default function MovieTableMnt({ type }: MovieTableMntProps) {
    const router = useRouter();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [yearRange, setYearRange] = useState<[number, number] | null>(null);
    const [filterCount, setFilterCount] = useState(0);
    const [localFilters, setLocalFilters] = useState<CrudFilters>([]);
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

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

    const { selectProps: categorySelectProps } = useSelect({
        resource: 'categories',
        dataProviderName: 'graphql',
        meta: {
            gqlQuery: CATEGORIES_LIST_QUERY,
            operation: 'categories',
        },
        optionLabel: 'name',
        optionValue: 'slug',
    });

    const { selectProps: regionSelectProps } = useSelect({
        resource: 'regions',
        dataProviderName: 'graphql',
        meta: {
            gqlQuery: REGIONS_LIST_QUERY,
            operation: 'regions',
        },
        optionLabel: 'name',
        optionValue: 'slug',
    });

    useEffect(() => {
        // Synchronize filters from useTable hook with localFilters
        setLocalFilters(filters || []);
        setFilterCount(filters?.length || 0);

        // Update yearRange if 'years' filter exists
        const yearsFilter = filters?.find((f) => (f as LogicalFilter).field === 'years');
        if (yearsFilter) {
            const [start, end] = (yearsFilter as LogicalFilter).value.split('-');
            setYearRange([parseInt(start), parseInt(end)]);
        } else {
            setYearRange(null);
        }
    }, [filters]);

    const handleFilterChange = (key: string, value: unknown) => {
        let newFilters = localFilters.filter((x) => (x as LogicalFilter)?.field !== key);

        if (value !== undefined && value !== null && value?.toString()?.trim() !== '') {
            newFilters = [
                ...newFilters,
                {
                    field: key,
                    value: Array.isArray(value) ? value.join(',') : value,
                    operator: Array.isArray(value) ? 'in' : 'eq',
                },
            ];
        }
        setLocalFilters(newFilters);
    };

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setSearchKeyword(value);
    }, 300);

    const handleSearch = useCallback(() => {
        const newFilters = localFilters.filter((x) => (x as LogicalFilter)?.field !== 'keywords');
        if (searchKeyword.trim() !== '') {
            newFilters.push({
                field: 'keywords',
                value: searchKeyword,
                operator: 'eq',
            });
        }
        setFilters(newFilters);
    }, [searchKeyword, localFilters, setFilters]);

    const handleYearRangeChange = (values: [number, number] | null) => {
        setYearRange(values);
        if (values && values[0] && values[1]) {
            handleFilterChange('years', `${values[0]}-${values[1]}`);
        } else {
            handleFilterChange('years', undefined);
        }
    };

    const applyFilters = () => {
        setFilters(localFilters);
        setDrawerVisible(false);
    };

    const renderFilters = () => (
        <Form layout="vertical">
            <Form.Item label="Format">
                <Select
                    style={{ width: '100%' }}
                    placeholder="Select format"
                    onChange={(value) => handleFilterChange('type', value)}
                    allowClear
                    value={
                        (
                            localFilters.find(
                                (f) => (f as LogicalFilter).field === 'type',
                            ) as LogicalFilter
                        )?.value
                    }
                >
                    {typeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item label="Release Year">
                <Space>
                    <Select
                        style={{ width: 120 }}
                        placeholder="From year"
                        onChange={(value) =>
                            handleYearRangeChange(
                                value ? [value, yearRange?.[1] ?? currentYear] : null,
                            )
                        }
                        value={yearRange?.[0]}
                    >
                        {yearOptions.map((year) => (
                            <Option key={year} value={year}>
                                {year}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        style={{ width: 120 }}
                        placeholder="To year"
                        onChange={(value) =>
                            handleYearRangeChange(value ? [yearRange?.[0] ?? 1900, value] : null)
                        }
                        value={yearRange?.[1]}
                    >
                        {yearOptions.map((year) => (
                            <Option key={year} value={year}>
                                {year}
                            </Option>
                        ))}
                    </Select>
                </Space>
            </Form.Item>
            <Form.Item label="Category">
                <Select
                    {...categorySelectProps}
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Select category"
                    onChange={(value) => handleFilterChange('categories', value)}
                    value={(
                        localFilters.find(
                            (f) => (f as LogicalFilter).field === 'categories',
                        ) as LogicalFilter
                    )?.value?.split(',')}
                    onSearch={(keyword) => {
                        const regex = createRegex(keyword);
                        return categorySelectProps.options?.filter(
                            (category) =>
                                regex.test(category.label as string) ||
                                regex.test(category.value as string),
                        );
                    }}
                />
            </Form.Item>
            <Form.Item label="Country">
                <Select
                    {...regionSelectProps}
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Select country"
                    onChange={(value) => handleFilterChange('countries', value)}
                    value={(
                        localFilters.find(
                            (f) => (f as LogicalFilter).field === 'countries',
                        ) as LogicalFilter
                    )?.value?.split(',')}
                    onSearch={(keyword) => {
                        const regex = createRegex(keyword);
                        return regionSelectProps.options?.filter(
                            (region) =>
                                regex.test(region.label as string) ||
                                regex.test(region.value as string),
                        );
                    }}
                />
            </Form.Item>
            <Form.Item label="Status">
                <Select
                    style={{ width: '100%' }}
                    placeholder="Select status"
                    onChange={(value) => handleFilterChange('status', value)}
                    allowClear
                    value={
                        (
                            localFilters.find(
                                (f) => (f as LogicalFilter).field === 'status',
                            ) as LogicalFilter
                        )?.value
                    }
                >
                    {statusOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item>
                <Checkbox
                    onChange={(e) => handleFilterChange('cinemaRelease', e.target.checked)}
                    checked={
                        (
                            localFilters.find(
                                (f) => (f as LogicalFilter).field === 'cinemaRelease',
                            ) as LogicalFilter
                        )?.value === 'true'
                    }
                >
                    Cinema Release
                </Checkbox>
            </Form.Item>
            <Form.Item>
                <Checkbox
                    onChange={(e) => handleFilterChange('isCopyright', e.target.checked)}
                    checked={
                        (
                            localFilters.find(
                                (f) => (f as LogicalFilter).field === 'isCopyright',
                            ) as LogicalFilter
                        )?.value === 'true'
                    }
                >
                    Copyright
                </Checkbox>
            </Form.Item>
            <Form.Item>
                <Button type="primary" onClick={applyFilters}>
                    Apply Filters
                </Button>
            </Form.Item>
        </Form>
    );

    return (
        <List
            headerButtons={({ defaultButtons }) => {
                return (
                    <>
                        {type === 'show' && defaultButtons}
                        <RefreshMovieButton resource="movies" dataProviderName="graphql" />
                    </>
                );
            }}
        >
            <Card>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={18} lg={20}>
                        <Input.Search
                            placeholder="Search movie by name, actor, director or content"
                            allowClear
                            onChange={(e) => debouncedSearch(e.target.value)}
                            onSearch={handleSearch}
                            enterButton={
                                <Button icon={<SearchOutlined />} type="primary">
                                    Search
                                </Button>
                            }
                        />
                    </Col>
                    <Col xs={24} md={6} lg={4}>
                        <Tooltip title="Open advanced filters">
                            <Badge count={filterCount} size="small">
                                <Button
                                    onClick={() => setDrawerVisible(true)}
                                    icon={<FilterOutlined />}
                                    block
                                >
                                    Advanced Filters
                                </Button>
                            </Badge>
                        </Tooltip>
                    </Col>
                </Row>
            </Card>
            <Drawer
                title="Advanced Filters"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={320}
            >
                {renderFilters()}
            </Drawer>
            <Table<MovieType>
                {...tableProps}
                rowKey="_id"
                pagination={{
                    ...tableProps.pagination,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 24, 50, 100, 200, 500],
                    showTotal: (total, range) =>
                        `Showing ${range[0]}-${range[1]} of ${total} results`,
                    position: ['topRight', 'bottomRight'],
                    size: 'small',
                    simple: true,
                    responsive: true,
                }}
                size="small"
                columns={[
                    {
                        title: 'No.',
                        key: 'index',
                        width: 60,
                        render: (_, __, index) => {
                            if (!tableProps.pagination) return index + 1;
                            const { current, pageSize } = tableProps.pagination || {};
                            return (current - 1) * pageSize + index + 1;
                        },
                    },
                    {
                        title: 'Thumbnail',
                        dataIndex: 'thumbUrl',
                        key: 'thumbUrl',
                        width: 80,
                        render: (thumbUrl: string, record: MovieType) => (
                            <Tooltip title={record.name}>
                                <AntImage
                                    src={getOptimizedImageUrl(thumbUrl, {
                                        width: 480,
                                        height: 854,
                                        quality: 60,
                                    })}
                                    alt={record.name}
                                    width={40}
                                    height={60}
                                    preview={false}
                                    onClick={() =>
                                        router.push(`/movies/show/${record._id?.toString()}`)
                                    }
                                    style={{ cursor: 'pointer' }}
                                />
                            </Tooltip>
                        ),
                    },
                    {
                        title: 'Movie Title',
                        dataIndex: 'name',
                        key: 'name',
                        render: (name: string, record: MovieType) => (
                            <Space direction="vertical" size={0}>
                                <Text strong>{name}</Text>
                                {record.originName && (
                                    <Text type="secondary">{record.originName}</Text>
                                )}
                            </Space>
                        ),
                    },
                    {
                        title: 'Type',
                        dataIndex: 'type',
                        key: 'type',
                        width: 100,
                        render: (type: MovieTypeEnum) => (
                            <Tag color={type === MovieTypeEnum.SINGLE ? 'blue' : 'green'}>
                                {typeOptions.find((option) => option.value === type)?.label || type}
                            </Tag>
                        ),
                    },
                    {
                        title: 'Year',
                        dataIndex: 'year',
                        key: 'year',
                        width: 80,
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('year', sorters),
                    },
                    {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        render: (status: MovieStatus) => {
                            const color =
                                status === MovieStatus.COMPLETED
                                    ? 'green'
                                    : status === MovieStatus.ONGOING
                                    ? 'blue'
                                    : 'orange';
                            return (
                                <Badge
                                    status={color as any}
                                    text={
                                        statusOptions.find((o) => o.value === status)?.label ||
                                        status
                                    }
                                />
                            );
                        },
                    },
                    {
                        title: 'Current Episode',
                        dataIndex: 'episodeCurrent',
                        key: 'episodeCurrent',
                        width: 120,
                        render: (episodeCurrent: string) => (
                            <Text>{episodeCurrent.toLowerCase()}</Text>
                        ),
                    },
                    {
                        title: 'Views',
                        dataIndex: 'view',
                        key: 'view',
                        width: 100,
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('view', sorters),
                        render: (view: number) => <Text strong>{view.toLocaleString()}</Text>,
                    },
                    {
                        title: 'Last Updated',
                        dataIndex: 'updatedAt',
                        key: 'updatedAt',
                        width: 150,
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('updatedAt', sorters),
                        render: (date: string) => (
                            <DateField value={new Date(date)} format="HH:mm DD/MM/YYYY" />
                        ),
                    },
                    {
                        title: 'Actions',
                        key: 'actions',
                        fixed: 'right',
                        width: 120,
                        render: (_, record) => {
                            if (type === 'show') {
                                return (
                                    <Space>
                                        <Tooltip title="View details">
                                            <Button
                                                icon={<EyeOutlined />}
                                                onClick={() =>
                                                    router.push(
                                                        `/movies/show/${record._id?.toString()}`,
                                                    )
                                                }
                                                size="small"
                                            />
                                        </Tooltip>
                                        <Tooltip title="Edit">
                                            <EditMovieButton
                                                id={record._id?.toString()}
                                                hideText
                                                size="small"
                                            />
                                        </Tooltip>
                                        <Tooltip title="Delete">
                                            <DeleteMovieButton
                                                id={record._id?.toString()}
                                                type="soft-delete"
                                                deleteButtonProps={{
                                                    icon: <DeleteOutlined />,
                                                    size: 'small',
                                                }}
                                            />
                                        </Tooltip>
                                    </Space>
                                );
                            } else {
                                return (
                                    <Space>
                                        <Tooltip title="Restore">
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
                                        </Tooltip>
                                        <Tooltip title="Permanently delete">
                                            <DeleteMovieButton
                                                id={record._id?.toString()}
                                                type="hard-delete"
                                                deleteButtonProps={{
                                                    icon: <DeleteOutlined />,
                                                    hideText: true,
                                                    size: 'small',
                                                    mutationMode: 'undoable',
                                                }}
                                            />
                                        </Tooltip>
                                    </Space>
                                );
                            }
                        },
                    },
                ]}
                onChange={(pagination, filters, sorter, extra) => {
                    tableProps.onChange?.(pagination, filters, sorter, extra);
                }}
            />
        </List>
    );
}
