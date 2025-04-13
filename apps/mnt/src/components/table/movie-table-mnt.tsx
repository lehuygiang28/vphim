'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTable, List, DateField, useSelect, getDefaultSortOrder } from '@refinedev/antd';
import { CrudFilters, LogicalFilter } from '@refinedev/core';
import { useDebouncedCallback } from 'use-debounce';
import {
    Table,
    Space,
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
    Tag,
} from 'antd';
import { SearchOutlined, FilterOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { createRegex } from '@vn-utils/text';

import {
    MovieTypeEnum,
    MovieStatusEnum,
    MovieQualityEnum,
    MovieContentRatingEnum,
} from '~api/app/movies/movie.constant';
import type { MovieType } from '~api/app/movies/movie.type';
import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';
import { CATEGORIES_LIST_QUERY } from '~fe/queries/categories';
import { REGIONS_LIST_QUERY } from '~fe/queries/regions';
import { getContentRatingLabel } from '~fe/components/tag/movie-content-rating';

import { MNT_MOVIE_LIST_QUERY, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';
import { RestoreButton } from '../button/restore-button';
import { DeleteMovieButton } from '../button/delete-movie-button';
import { RefreshMovieButton } from '../button/refresh-movie-button';
import { EditMovieButton } from '../button/edit-movie-button';
import MovieStatusTag, { movieStatusOptions } from '../tag/movie-status-tag';
import MovieTypeTag, { movieTypeOptions } from '../tag/movie-type-tag';

const { Text } = Typography;
const { Option } = Select;

export type MovieTableMntProps = {
    type: 'show' | 'recycle-bin';
};

// Quality options for filter
const qualityOptions = [
    { value: MovieQualityEnum._4K, label: '4K' },
    { value: MovieQualityEnum.FHD, label: 'FHD' },
    { value: MovieQualityEnum.HD, label: 'HD' },
    { value: MovieQualityEnum.SD, label: 'SD' },
    { value: MovieQualityEnum.CAM, label: 'CAM' },
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

    const { tableProps, sorters, filters, setFilters, setCurrent } = useTable<MovieType>({
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
            defaultBehavior: 'replace',
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
        pagination: {
            mode: 'server',
            current: 1,
            pageSize: 500,
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
        pagination: {
            mode: 'server',
            current: 1,
            pageSize: 500,
        },
        optionLabel: 'name',
        optionValue: 'slug',
    });

    useEffect(() => {
        // Synchronize filters from useTable hook with localFilters
        // Update localFilters and filterCount based on the current filters
        const updatedFilters = filters || [];
        setLocalFilters(updatedFilters);

        // Count only non-empty filters
        const activeFilterCount = updatedFilters.filter((filter) => {
            const logicalFilter = filter as LogicalFilter;
            return (
                logicalFilter.value !== undefined &&
                logicalFilter.value !== null &&
                logicalFilter.value.toString().trim() !== ''
            );
        }).length;

        setFilterCount(activeFilterCount);

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
        setCurrent(1);
        setFilters(localFilters);
        setDrawerVisible(false);
    };

    const renderFilters = () => (
        <Form layout="vertical">
            <Form.Item label="Định dạng">
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn định dạng"
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
                    {movieTypeOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item label="Trạng thái">
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn trạng thái"
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
                    {movieStatusOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item label="Chất lượng">
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn chất lượng"
                    onChange={(value) => handleFilterChange('quality', value)}
                    allowClear
                    value={
                        (
                            localFilters.find(
                                (f) => (f as LogicalFilter).field === 'quality',
                            ) as LogicalFilter
                        )?.value
                    }
                >
                    {qualityOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
            <Form.Item label="Phân loại độ tuổi">
                <Select
                    style={{ width: '100%' }}
                    placeholder="Chọn phân loại độ tuổi"
                    onChange={(value) => handleFilterChange('contentRating', value)}
                    allowClear
                    value={
                        (
                            localFilters.find(
                                (f) => (f as LogicalFilter).field === 'contentRating',
                            ) as LogicalFilter
                        )?.value
                    }
                >
                    {Object.values(MovieContentRatingEnum).map((rating) => {
                        const fullLabel = getContentRatingLabel(rating);
                        const [code, description] = fullLabel.split(' - ');
                        return (
                            <Option key={rating} value={rating}>
                                <Space>
                                    <Tag
                                        color={
                                            rating === MovieContentRatingEnum.P
                                                ? 'green'
                                                : rating === MovieContentRatingEnum.K
                                                ? 'lime'
                                                : rating === MovieContentRatingEnum.T13
                                                ? 'blue'
                                                : rating === MovieContentRatingEnum.T16
                                                ? 'orange'
                                                : rating === MovieContentRatingEnum.T18
                                                ? 'volcano'
                                                : rating === MovieContentRatingEnum.C
                                                ? 'red'
                                                : 'default'
                                        }
                                    >
                                        {code}
                                    </Tag>
                                    <span>{description}</span>
                                </Space>
                            </Option>
                        );
                    })}
                </Select>
            </Form.Item>
            <Form.Item label="Năm phát hành">
                <Space>
                    <Select
                        style={{ width: 120 }}
                        placeholder="Từ năm"
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
                        placeholder="Đến năm"
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
            <Form.Item label="Thể loại">
                <Select
                    {...categorySelectProps}
                    allowClear
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Chọn thể loại"
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
            <Form.Item label="Quốc gia">
                <Select
                    {...regionSelectProps}
                    allowClear
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Chọn quốc gia"
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
                    Chiếu rạp
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
                    Bản quyền
                </Checkbox>
            </Form.Item>
            <Form.Item>
                <Button type="primary" onClick={applyFilters}>
                    Áp dụng bộ lọc
                </Button>
            </Form.Item>
        </Form>
    );

    return (
        <List
            title={`${type === 'show' ? ' Danh sách Phim' : 'Thùng rác'}`}
            headerButtons={({ defaultButtons }) => {
                return (
                    <>
                        {type === 'show' && defaultButtons}
                        <RefreshMovieButton resource="movies" dataProviderName="graphql">
                            Làm mới
                        </RefreshMovieButton>
                    </>
                );
            }}
            createButtonProps={{
                children: <>Thêm mới</>,
            }}
        >
            <Card>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={18} lg={20}>
                        <Input.Search
                            placeholder="Tìm phim theo tên, diễn viên, đạo diễn hoặc nội dung"
                            allowClear
                            onChange={(e) => debouncedSearch(e.target.value)}
                            onSearch={handleSearch}
                            enterButton={
                                <Button icon={<SearchOutlined />} type="primary">
                                    Tìm kiếm
                                </Button>
                            }
                        />
                    </Col>
                    <Col xs={24} md={6} lg={4}>
                        <Tooltip title="Mở bộ lọc nâng cao">
                            <Badge count={filterCount} size="small">
                                <Button
                                    onClick={() => setDrawerVisible(true)}
                                    icon={<FilterOutlined />}
                                    block
                                >
                                    Bộ lọc nâng cao
                                </Button>
                            </Badge>
                        </Tooltip>
                    </Col>
                </Row>
            </Card>
            <Drawer
                title="Bộ lọc nâng cao"
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
                        `Hiển thị ${range[0]}-${range[1]} trên tổng ${total} kết quả`,
                    position: ['topRight', 'bottomRight'],
                    size: 'small',
                    simple: true,
                    responsive: true,
                }}
                size="small"
                columns={[
                    {
                        title: 'STT',
                        key: 'index',
                        width: 60,
                        render: (_, __, index) => {
                            if (!tableProps.pagination) return index + 1;
                            const { current, pageSize } = tableProps.pagination || {};
                            return (current - 1) * pageSize + index + 1;
                        },
                    },
                    {
                        title: 'Poster',
                        dataIndex: 'posterUrl',
                        key: 'posterUrl',
                        width: 80,
                        render: (posterUrl: string, record: MovieType) => (
                            <Tooltip title={record.name}>
                                <AntImage
                                    src={getOptimizedImageUrl(posterUrl, {
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
                        title: 'Tên phim',
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
                        title: 'Loại',
                        dataIndex: 'type',
                        key: 'type',
                        width: 100,
                        render: (type: MovieTypeEnum) => <MovieTypeTag type={type} />,
                    },
                    {
                        title: 'Trạng thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 120,
                        render: (status: MovieStatusEnum) => {
                            return <MovieStatusTag status={status} />;
                        },
                    },
                    {
                        title: 'Năm',
                        dataIndex: 'year',
                        key: 'year',
                        width: 80,
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('year', sorters),
                    },
                    {
                        title: 'Tập hiện tại',
                        dataIndex: 'episodeCurrent',
                        key: 'episodeCurrent',
                        width: 120,
                        render: (episodeCurrent: string) => (
                            <Text>{episodeCurrent.toLowerCase()}</Text>
                        ),
                    },
                    {
                        title: 'Lượt xem',
                        dataIndex: 'view',
                        key: 'view',
                        width: 100,
                        sorter: true,
                        defaultSortOrder: getDefaultSortOrder('view', sorters),
                        render: (view: number) => <Text strong>{view.toLocaleString()}</Text>,
                    },
                    {
                        title: 'Cập nhật lần cuối',
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
                        title: 'Thao tác',
                        key: 'actions',
                        fixed: 'right',
                        width: 120,
                        render: (_, record) => {
                            if (type === 'show') {
                                return (
                                    <Space>
                                        <Tooltip title="Xem chi tiết">
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
                                        <Tooltip title="Chỉnh sửa">
                                            <EditMovieButton
                                                id={record._id?.toString()}
                                                hideText
                                                size="small"
                                            />
                                        </Tooltip>
                                        <Tooltip title="Xóa">
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
                                        <Tooltip title="Khôi phục">
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
                                        <Tooltip title="Xóa vĩnh viễn">
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
