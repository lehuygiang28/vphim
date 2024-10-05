'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Row, Col, Select, Button, Input, Space, Drawer, Tag, Checkbox, Grid } from 'antd';
import { LogicalFilter, useList } from '@refinedev/core';
import { SearchOutlined, FilterOutlined, CloseOutlined } from '@ant-design/icons';
import { createRegex } from '@vn-utils/text';

import { movieTypeTranslations } from '@/constants/translation-enum';
import { CATEGORIES_LIST_QUERY } from '@/queries/categories';
import { REGIONS_LIST_QUERY } from '@/queries/regions';
import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';
import { LocalQuery } from './index';

const { Option } = Select;
const { useBreakpoint } = Grid;

interface MovieFiltersProps {
    isSearching?: boolean;
    query: LocalQuery;
    setQuery: React.Dispatch<React.SetStateAction<undefined | LocalQuery>>;
    applySearch: (localQuery: LocalQuery) => void;
}

const sortOptions = [
    { value: 'view,desc', label: 'Phổ biến nhất' },
    { value: 'bestMatch,asc', label: 'Phù hợp nhất' },
    { value: 'year,desc', label: 'Mới nhất' },
    { value: 'year,asc', label: 'Cũ nhất' },
    { value: 'updatedAt,desc', label: 'Cập nhật gần đây' },
];

const statusOptions = [
    { value: 'trailer', label: 'Trailer' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'ongoing', label: 'Đang chiếu' },
    { value: 'updating', label: 'Đang cập nhật' },
];

export const MovieFilters: React.FC<MovieFiltersProps> = ({
    query,
    setQuery,
    applySearch,
    isSearching = false,
}) => {
    const { md } = useBreakpoint();
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 124 }, (_, i) => currentYear - i);
    const [keywordsInput, setKeywordsInput] = useState<string | undefined>(undefined);
    const [drawerVisible, setDrawerVisible] = useState(false);

    const { data: categories } = useList<Category>({
        dataProviderName: 'graphql',
        resource: 'categories',
        meta: {
            gqlQuery: CATEGORIES_LIST_QUERY,
            operation: 'categories',
        },
        pagination: {
            current: 1,
            pageSize: 1000,
        },
    });

    const { data: regions } = useList<Region>({
        dataProviderName: 'graphql',
        resource: 'regions',
        meta: {
            gqlQuery: REGIONS_LIST_QUERY,
            operation: 'regions',
        },
        pagination: {
            current: 1,
            pageSize: 1000,
        },
    });

    const getFilterValue = useCallback(
        (field: string) => {
            const filter = query?.filters?.find(
                (x) => (x as LogicalFilter)?.field === field,
            ) as LogicalFilter;
            return (
                (filter?.value?.toString() as string)
                    ?.split(',')
                    ?.filter((f) => !!f)
                    ?.map((y: string) => y?.trim()) || []
            );
        },
        [query],
    );

    useEffect(() => {
        const keywordsFilter = getFilterValue('keywords');
        setKeywordsInput(keywordsFilter?.[0] || undefined);
    }, [query, getFilterValue]);

    const handleFilterChange = (key: string, value: unknown) => {
        let newFilters = query?.filters?.filter((x) => (x as LogicalFilter)?.field !== key);

        if (value !== undefined && value !== null && value?.toString()?.trim() !== '') {
            newFilters = [
                ...(newFilters || []),
                {
                    field: key,
                    value: Array.isArray(value) ? value.join(',') : value,
                    operator: Array.isArray(value) ? 'in' : 'eq',
                },
            ];
        }
        setQuery((prev) => ({ ...prev, filters: newFilters }));
        return newFilters;
    };

    const handleSorterChange = (value: string) => {
        const [val, ord] = value?.split(',') || [];
        if (value !== null || value !== undefined) {
            setQuery((prev) => ({
                ...prev,
                sorters: [{ field: val, order: ord === 'asc' ? 'asc' : 'desc' }],
            }));
        }
    };

    const renderFilters = () => (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Select
                style={{ width: '100%' }}
                placeholder="Chọn định dạng"
                value={getFilterValue('type')?.[0] || undefined}
                onChange={(value) => handleFilterChange('type', value)}
                allowClear
                onClear={() => handleFilterChange('type', undefined)}
            >
                {Object.entries(movieTypeTranslations).map(([key, value]) => (
                    <Option key={key} value={key}>
                        {value}
                    </Option>
                ))}
            </Select>
            <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Chọn năm phát hành"
                value={getFilterValue('years')}
                onChange={(value) => handleFilterChange('years', value)}
                allowClear
                onClear={() => handleFilterChange('years', undefined)}
                maxTagCount={6}
            >
                {yearOptions.map((year) => (
                    <Option key={year} value={year.toString()}>
                        {year}
                    </Option>
                ))}
            </Select>
            <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="Chọn thể loại"
                value={getFilterValue('categories')}
                onChange={(value) => handleFilterChange('categories', value)}
                onClear={() => handleFilterChange('categories', undefined)}
                onSearch={(keyword) => {
                    const regex = createRegex(keyword);
                    return categories?.data?.filter(
                        (category) => regex.test(category.name) || regex.test(category.slug),
                    );
                }}
                maxTagCount={6}
            >
                {categories?.data?.map((category) => (
                    <Option key={category.slug} value={category.slug}>
                        {category.name}
                    </Option>
                ))}
            </Select>
            <Select
                mode="multiple"
                allowClear
                style={{ width: '100%' }}
                placeholder="Chọn quốc gia"
                value={getFilterValue('countries')}
                onChange={(value) => handleFilterChange('countries', value)}
                onClear={() => handleFilterChange('countries', undefined)}
                onSearch={(keyword) => {
                    const regex = createRegex(keyword);
                    return regions?.data?.filter(
                        (country) => regex.test(country.name) || regex.test(country.slug),
                    );
                }}
                maxTagCount={6}
            >
                {regions?.data?.map((country) => (
                    <Option key={country.slug} value={country.slug}>
                        {country.name}
                    </Option>
                ))}
            </Select>
            <Select
                style={{ width: '100%' }}
                placeholder="Chọn trạng thái"
                value={getFilterValue('status')?.[0] || undefined}
                onChange={(value) => handleFilterChange('status', value)}
                allowClear
                onClear={() => handleFilterChange('status', undefined)}
            >
                {statusOptions.map((option) => (
                    <Option key={option.value} value={option.value}>
                        {option.label}
                    </Option>
                ))}
            </Select>
            <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
                <Checkbox
                    checked={getFilterValue('cinemaRelease')?.[0]?.toString() === 'true'}
                    onChange={(checked) =>
                        handleFilterChange('cinemaRelease', checked.target.checked)
                    }
                >
                    Phim chiếu rạp
                </Checkbox>
            </Space>
            <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
                <Checkbox
                    checked={getFilterValue('isCopyright')?.[0]?.toString() === 'true'}
                    onChange={(checked) =>
                        handleFilterChange('isCopyright', checked.target.checked)
                    }
                >
                    Phim bản quyền
                </Checkbox>
            </Space>
        </Space>
    );

    const renderFilterTags = () => {
        const tags: React.ReactNode[] = [];

        // Keywords always first
        if (keywordsInput) {
            tags.push(
                <Tag
                    key="keywords"
                    closable
                    onClose={() => {
                        setKeywordsInput('');
                        handleFilterChange('keywords', undefined);
                    }}
                >
                    Từ khóa: {keywordsInput}
                </Tag>,
            );
        }

        // Define the order of filters
        const filterOrder = [
            'type',
            'countries',
            'categories',
            'years',
            'cinemaRelease',
            'isCopyright',
            'status',
        ];

        // Sort filters based on the defined order
        const sortedFilters = query?.filters?.sort((a, b) => {
            const aIndex = filterOrder.indexOf((a as LogicalFilter).field);
            const bIndex = filterOrder.indexOf((b as LogicalFilter).field);
            return aIndex - bIndex;
        });

        sortedFilters?.forEach((_filter) => {
            const filter = _filter as LogicalFilter;
            if (filter.field !== 'keywords') {
                const values = filter.value.toString().split(',');
                values.forEach((value: string) => {
                    let label = '';
                    let displayValue = value;

                    switch (filter.field) {
                        case 'type':
                            label = 'Định dạng';
                            displayValue =
                                movieTypeTranslations[
                                    value as keyof typeof movieTypeTranslations
                                ] || value;
                            break;
                        case 'years':
                            label = 'Năm phát hành';
                            break;
                        case 'categories':
                            label = 'Thể loại';
                            displayValue =
                                categories?.data?.find((cat) => cat.slug === value)?.name || value;
                            break;
                        case 'countries':
                            label = 'Quốc gia';
                            displayValue =
                                regions?.data?.find((reg) => reg.slug === value)?.name || value;
                            break;
                        case 'cinemaRelease':
                            label = 'Chiếu rạp';
                            displayValue = value?.toString() === 'true' ? 'Có' : 'Không';
                            break;
                        case 'isCopyright':
                            label = 'Bản quyền';
                            displayValue = value?.toString() === 'true' ? 'Có' : 'Không';
                            break;
                        case 'status':
                            label = 'Trạng thái';
                            displayValue =
                                statusOptions.find((option) => option.value === value)?.label ||
                                value;
                            break;
                        default:
                            label = filter.field;
                    }
                    if (
                        displayValue !== undefined &&
                        displayValue !== null &&
                        displayValue !== ''
                    ) {
                        tags.push(
                            <Tag
                                key={`${filter.field}-${value}`}
                                closable
                                onClose={() => {
                                    const newValues = values.filter((v) => v !== value);
                                    handleFilterChange(
                                        filter.field,
                                        newValues.length ? newValues : undefined,
                                    );
                                }}
                            >
                                {label}: {displayValue}
                            </Tag>,
                        );
                    }
                });
            }
        });

        return tags;
    };

    const clearAllFilters = () => {
        setQuery((prev) => ({ ...prev, filters: [] }));
        setKeywordsInput('');
    };

    return (
        <>
            <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12} lg={12}>
                    <Input.Search
                        placeholder="Tìm phim theo tên phim, diễn viên, đạo diễn hoặc nội dung"
                        allowClear
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                        onSearch={async (value) => {
                            const newFilters = handleFilterChange('keywords', value || undefined);
                            applySearch({ ...query, filters: newFilters });
                        }}
                        enterButton={
                            <Button
                                icon={<SearchOutlined />}
                                type="primary"
                                loading={isSearching}
                                disabled={isSearching}
                            >
                                {md ? <>{isSearching ? 'Đang tìm...' : 'Tìm kiếm'}</> : ''}
                            </Button>
                        }
                        inputMode="search"
                        autoComplete="off"
                        disabled={isSearching}
                        loading={isSearching}
                    />
                </Col>
                <Col xs={14} md={4} lg={4}>
                    <Select
                        placeholder="Xắp xếp theo"
                        value={
                            query?.sorters?.[0]?.field && query?.sorters?.[0]?.order
                                ? `${query?.sorters?.[0]?.field},${query?.sorters?.[0]?.order}`
                                : 'view,desc'
                        }
                        style={{ width: '100%' }}
                        onChange={handleSorterChange}
                    >
                        {sortOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Col>
                <Col xs={10} md={2} lg={2}>
                    <Button
                        onClick={() => setDrawerVisible(true)}
                        icon={<FilterOutlined />}
                        block
                        aria-label="Mở bộ lọc"
                    >
                        Bộ lọc
                    </Button>
                </Col>
            </Row>
            {renderFilterTags().length > 0 && (
                <Row style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Space wrap>{renderFilterTags()}</Space>
                    </Col>
                </Row>
            )}
            <Drawer
                title="Bộ lọc nâng cao"
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={320}
            >
                {renderFilters()}
                <Row style={{ marginTop: 16 }} gutter={[8, 8]}>
                    <Col span={10}>
                        <Button
                            onClick={clearAllFilters}
                            icon={<CloseOutlined />}
                            block
                            aria-label="Xóa tất cả bộ lọc"
                        >
                            Xóa bộ lọc
                        </Button>
                    </Col>
                    <Col span={14}>
                        <Button
                            type="primary"
                            onClick={() => {
                                setDrawerVisible(false);
                                applySearch(query);
                            }}
                            block
                        >
                            Áp dụng bộ lọc
                        </Button>
                    </Col>
                </Row>
            </Drawer>
        </>
    );
};
