'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Row,
    Col,
    Select,
    Button,
    Space,
    Drawer,
    Tag,
    Checkbox,
    Grid,
    Tooltip,
    Typography,
} from 'antd';
import { LogicalFilter, useList } from '@refinedev/core';
import { FilterOutlined, CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { createRegex } from '@vn-utils/text';
import { useCopilotReadable } from '@copilotkit/react-core';

import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';

import { movieTypeTranslations } from '@/constants/translation-enum';
import { CATEGORIES_LIST_QUERY } from '@/queries/categories';
import { REGIONS_LIST_QUERY } from '@/queries/regions';

import { LocalQuery } from './index';
import { SearchInput } from './search-input';

const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface MovieFiltersProps {
    isSearching?: boolean;
    query: LocalQuery;
    setQuery: React.Dispatch<React.SetStateAction<undefined | LocalQuery>>;
    applySearch: (localQuery: LocalQuery) => void;
}

const sortOptions = [
    { value: 'bestMatch,asc', label: 'Phù hợp nhất' },
    { value: 'view,desc', label: 'Phổ biến nhất' },
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
        // Reset pagination to first page when filters change
        setQuery((prev) => ({
            ...prev,
            filters: newFilters,
            pagination: { ...prev?.pagination, current: 1 },
        }));
        return newFilters;
    };

    const handleSorterChange = (value: string) => {
        const [val, ord] = value?.split(',') || [];
        if (value !== null || value !== undefined) {
            const newQuery: LocalQuery = {
                ...query,
                sorters: [{ field: val, order: ord === 'asc' ? 'asc' : 'desc' }],
                pagination: { ...query?.pagination, current: 1 },
            };
            setQuery(newQuery);
            // Trigger search immediately when sort changes
            applySearch(newQuery);
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
                    onChange={(e) => handleFilterChange('cinemaRelease', e.target.checked)}
                >
                    Phim chiếu rạp
                </Checkbox>
            </Space>
            <Space direction="horizontal" size="middle" style={{ width: '100%' }}>
                <Checkbox
                    checked={getFilterValue('isCopyright')?.[0]?.toString() === 'true'}
                    onChange={(e) => handleFilterChange('isCopyright', e.target.checked)}
                >
                    Phim bản quyền
                </Checkbox>
            </Space>
        </Space>
    );

    const renderFilterTags = () => {
        const tags: React.ReactNode[] = [];

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
            if (filter.field !== 'keywords' && filter.field !== 'useAI') {
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

    useCopilotReadable({
        value: getFilterValue('keywords')[0] || '',
        description: 'Search terms for movie titles, actors, directors, or content',
        categories: ['search-terms', 'user-input'],
        parentId: 'movie-search',
    });

    useCopilotReadable({
        value: getFilterValue('type')[0] || '',
        description: 'Movie format type (series, movie, show, etc.)',
        categories: ['format', 'movie-metadata'],
        parentId: 'movie-metadata',
    });

    useCopilotReadable({
        value: getFilterValue('categories'),
        description: 'Movie genres and themes that categorize the content',
        categories: ['genres', 'content-classification'],
        parentId: 'movie-metadata',
    });

    useCopilotReadable({
        value: getFilterValue('countries'),
        description: 'Countries where the movie was produced or originated from',
        categories: ['geographical-data', 'production-info'],
        parentId: 'movie-metadata',
    });

    useCopilotReadable({
        value: getFilterValue('years'),
        description: 'Release years of the movies, used for temporal filtering',
        categories: ['temporal-data', 'release-info'],
        parentId: 'movie-metadata',
    });

    useCopilotReadable({
        value: getFilterValue('status')[0] || '',
        description: 'Current airing or production status of the movie',
        categories: ['status', 'availability'],
        parentId: 'movie-metadata',
    });

    useCopilotReadable({
        value: getFilterValue('cinemaRelease')[0] === 'true',
        description: 'Whether the movie had a theatrical/cinema release',
        categories: ['release-type', 'distribution'],
        parentId: 'movie-metadata',
    });

    useCopilotReadable({
        value: getFilterValue('isCopyright')[0] === 'true',
        description: 'Whether the movie is officially licensed/copyrighted content',
        categories: ['licensing', 'legal-status'],
        parentId: 'movie-metadata',
    });

    useCopilotReadable({
        value: getFilterValue('categories').map(
            (slug) => categories?.data?.find((cat) => cat.slug === slug)?.name || slug,
        ),
        description: 'Full names of selected movie categories/genres',
        categories: ['display-names', 'genres'],
        parentId: 'movie-display',
        convert: (description, value) => (Array.isArray(value) ? value.join(', ') : String(value)),
    });

    useCopilotReadable({
        value: getFilterValue('countries').map(
            (slug) => regions?.data?.find((reg) => reg.slug === slug)?.name || slug,
        ),
        description: 'Full names of selected countries/regions',
        categories: ['display-names', 'geographical-data'],
        parentId: 'movie-display',
        convert: (description, value) => (Array.isArray(value) ? value.join(', ') : String(value)),
    });

    return (
        <>
            <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={12} lg={12}>
                    <SearchInput
                        value={keywordsInput}
                        onChange={setKeywordsInput}
                        onSearch={(value) => {
                            const newFilters = handleFilterChange('keywords', value || undefined);
                            applySearch({ ...query, filters: newFilters });
                        }}
                        isAIMode={getFilterValue('useAI')?.[0]?.toString() === 'true'}
                        loading={isSearching}
                        placeholder="Tìm phim theo tên phim, diễn viên, đạo diễn hoặc nội dung"
                        aiPlaceholder="Mô tả chi tiết phim bạn muốn tìm (ví dụ: phim về phép thuật)"
                    />
                </Col>
                <Col xs={14} md={4} lg={3}>
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
                <Col xs={10} md={3} lg={2}>
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
            <Row gutter={[16, 16]} align="middle" style={{ marginTop: 8 }}>
                <Col>
                    <Space align={'center'} size={'small'}>
                        <Checkbox
                            checked={getFilterValue('useAI')?.[0]?.toString() === 'true'}
                            onChange={(e) => handleFilterChange('useAI', e.target.checked)}
                        >
                            <Text>Tìm kiếm với AI</Text>
                        </Checkbox>
                        <Tooltip title="Nhập mô tả chi tiết về nội dung, cảnh phim hoặc cảm xúc bạn muốn tìm. AI sẽ giúp bạn tìm những bộ phim phù hợp.">
                            <QuestionCircleOutlined style={{ cursor: 'pointer' }} />
                        </Tooltip>
                    </Space>
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
