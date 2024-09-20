import React, { useCallback, useEffect, useState } from 'react';
import { Row, Col, Select, Button, Input } from 'antd';
import { CrudFilters, LogicalFilter, useList } from '@refinedev/core';
import { SearchOutlined } from '@ant-design/icons';
import { createRegex } from '@vn-utils/text';

import { movieTypeTranslations } from '@/constants/translation-enum';
import { CATEGORIES_LIST_QUERY } from '@/queries/categories';
import { REGIONS_LIST_QUERY } from '@/queries/regions';
import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';

const { Option } = Select;

interface MovieFiltersProps {
    localFilters: CrudFilters;
    localSorter: { field: string; order: 'asc' | 'desc' };
    onFilterChange: (key: string, value: unknown) => void;
    onSorterChange: (value: string) => void;
    onApplyFilters: () => void;
}

const sortOptions = [
    { value: 'view,desc', label: 'Phổ biến nhất' },
    { value: 'bestMatch,asc', label: 'Phù hợp nhất' },
    { value: 'year,desc', label: 'Mới nhất' },
    { value: 'year,asc', label: 'Cũ nhất' },
    { value: 'updatedAt,desc', label: 'Cập nhật gần đây' },
];

export const MovieFilters: React.FC<MovieFiltersProps> = ({
    localFilters,
    localSorter,
    onFilterChange,
    onSorterChange,
    onApplyFilters,
}) => {
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 124 }, (_, i) => currentYear - i);
    const [keywordsInput, setKeywordsInput] = useState<string | undefined>(undefined);

    useEffect(() => {
        const keywordsFilter = getFilterValue('keywords');
        setKeywordsInput(keywordsFilter?.[0] || undefined);
    }, [localFilters]);

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
            const filter = localFilters?.find(
                (x) => (x as LogicalFilter)?.field === field,
            ) as LogicalFilter;
            return (
                (filter?.value?.toString() as string)
                    ?.split(',')
                    ?.filter((f) => !!f)
                    ?.map((y: string) => y?.trim()) || []
            );
        },
        [localFilters],
    );

    const handleImmediateFilterChange = useCallback(
        (field: string, value: unknown) => {
            if (value === undefined || (Array.isArray(value) && value.length === 0)) {
                onFilterChange(field, undefined);
            } else {
                onFilterChange(field, value);
            }
        },
        [onFilterChange],
    );

    return (
        <Row gutter={[16, 16]} align="middle">
            <Col xs={12} sm={8} md={6} lg={4}>
                <Select
                    placeholder="Xắp xếp theo"
                    value={
                        localSorter?.field && localSorter?.order
                            ? `${localSorter?.field},${localSorter?.order}`
                            : 'view,desc'
                    }
                    style={{ width: '100%' }}
                    onChange={onSorterChange}
                >
                    {sortOptions.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
                <Select
                    style={{ width: '100%' }}
                    placeholder="Định dạng"
                    value={getFilterValue('type')?.[0] || undefined}
                    onChange={(value) => handleImmediateFilterChange('type', value)}
                    allowClear
                    onClear={() => handleImmediateFilterChange('type', undefined)}
                >
                    {Object.entries(movieTypeTranslations).map(([key, value]) => (
                        <Option key={key} value={key}>
                            {value}
                        </Option>
                    ))}
                </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
                <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="Năm phát hành"
                    value={getFilterValue('years')}
                    onChange={(value) => handleImmediateFilterChange('years', value)}
                    allowClear
                    onClear={() => handleImmediateFilterChange('years', undefined)}
                >
                    {yearOptions.map((year) => (
                        <Option key={year} value={year.toString()}>
                            {year}
                        </Option>
                    ))}
                </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
                <Select
                    mode="multiple"
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="Thể loại"
                    value={getFilterValue('categories')}
                    onChange={(value) => handleImmediateFilterChange('categories', value)}
                    onClear={() => handleImmediateFilterChange('categories', undefined)}
                    onSearch={(keyword) => {
                        const regex = createRegex(keyword);
                        return categories?.data?.filter(
                            (category) => regex.test(category.name) || regex.test(category.slug),
                        );
                    }}
                >
                    {categories?.data?.map((category) => (
                        <Option key={category.slug} value={category.slug}>
                            {category.name}
                        </Option>
                    ))}
                </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
                <Select
                    mode="multiple"
                    allowClear
                    style={{ width: '100%' }}
                    placeholder="Quốc gia"
                    value={getFilterValue('countries')}
                    onChange={(value) => handleImmediateFilterChange('countries', value)}
                    onClear={() => handleImmediateFilterChange('countries', undefined)}
                    onSearch={(keyword) => {
                        const regex = createRegex(keyword);
                        return regions?.data?.filter(
                            (country) => regex.test(country.name) || regex.test(country.slug),
                        );
                    }}
                >
                    {regions?.data?.map((country) => (
                        <Option key={country.slug} value={country.slug}>
                            {country.name}
                        </Option>
                    ))}
                </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
                <Input
                    placeholder="Tên phim, diễn viên, đạo diễn..."
                    allowClear
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    onBlur={() =>
                        handleImmediateFilterChange('keywords', keywordsInput || undefined)
                    }
                    onClear={() => {
                        setKeywordsInput('');
                        handleImmediateFilterChange('keywords', undefined);
                    }}
                />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
                <Button onClick={onApplyFilters} icon={<SearchOutlined />}>
                    Tìm kiếm
                </Button>
            </Col>
        </Row>
    );
};
