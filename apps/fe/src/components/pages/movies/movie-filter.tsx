'use client';

import './movie-filter.css';

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
    Modal,
    Badge,
    Collapse,
    Card,
    Switch,
} from 'antd';
import { LogicalFilter } from '@refinedev/core';
import {
    FilterOutlined,
    CloseOutlined,
    QuestionCircleOutlined,
    SearchOutlined,
    SortAscendingOutlined,
    RobotOutlined,
} from '@ant-design/icons';
import { createRegex } from '@vn-utils/text';
import { useCopilotReadable } from '@copilotkit/react-core';

import type { Category } from 'apps/api/src/app/categories/category.schema';
import type { Region } from 'apps/api/src/app/regions/region.schema';

import { movieTypeTranslations } from '@/constants/translation-enum';

import { LocalQuery } from './index';
import { SearchInput } from './search-input';

const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { Panel } = Collapse;

interface MovieFiltersProps {
    isSearching?: boolean;
    query: LocalQuery;
    setQuery: React.Dispatch<React.SetStateAction<undefined | LocalQuery>>;
    applySearch: (localQuery: LocalQuery) => void;
    categories: Category[];
    regions: Region[];
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
    categories,
    regions,
}) => {
    const { xs, sm, md } = useBreakpoint();
    const isMobile = xs || sm;
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 124 }, (_, i) => currentYear - i);
    const [keywordsInput, setKeywordsInput] = useState<string | undefined>(undefined);
    const [filterVisible, setFilterVisible] = useState(false);
    const [movieCountData, setMovieCountData] = useState<number | undefined>(undefined);

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

    // Calculate total active filters for the badge
    const getActiveFilterCount = useCallback(() => {
        let count = 0;
        query?.filters?.forEach((filter) => {
            const f = filter as LogicalFilter;
            if (f.field !== 'keywords' && f.field !== 'useAI') {
                const values = f.value.toString().split(',');
                count += values.filter((v) => v).length;
            }
        });
        return count;
    }, [query?.filters]);

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

    const renderFilterForm = () => (
        <div className="filters-form">
            <Collapse
                defaultActiveKey={['format', 'categories', 'countries']}
                ghost
                bordered={false}
            >
                <Panel header={<Text strong>Định dạng phim</Text>} key="format">
                    <div className="filter-chip-group">
                        {Object.entries(movieTypeTranslations).map(([key, value]) => (
                            <div
                                key={key}
                                className={`filter-chip ${
                                    getFilterValue('type')[0] === key ? 'active' : ''
                                }`}
                                onClick={() => {
                                    const currentValue = getFilterValue('type')[0];
                                    handleFilterChange(
                                        'type',
                                        currentValue === key ? undefined : key,
                                    );
                                }}
                            >
                                {value}
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel header={<Text strong>Thể loại</Text>} key="categories">
                    <Select
                        mode="multiple"
                        className="filter-select"
                        placeholder="Chọn thể loại"
                        value={getFilterValue('categories')}
                        onChange={(value) => handleFilterChange('categories', value)}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        onClear={() => handleFilterChange('categories', undefined)}
                        maxTagCount={isMobile ? 1 : 3}
                        filterOption={(input, option) => {
                            const regex = createRegex(input);
                            return regex.test(option?.label?.toString() || '');
                        }}
                    >
                        {categories?.map((category) => (
                            <Option key={category.slug} value={category.slug} label={category.name}>
                                {category.name}
                            </Option>
                        ))}
                    </Select>
                </Panel>

                <Panel header={<Text strong>Quốc gia</Text>} key="countries">
                    <Select
                        mode="multiple"
                        className="filter-select"
                        placeholder="Chọn quốc gia"
                        value={getFilterValue('countries')}
                        onChange={(value) => handleFilterChange('countries', value)}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        onClear={() => handleFilterChange('countries', undefined)}
                        filterOption={(input, option) => {
                            const regex = createRegex(input);
                            return regex.test(option?.label?.toString() || '');
                        }}
                        maxTagCount={isMobile ? 1 : 3}
                    >
                        {regions?.map((country) => (
                            <Option key={country.slug} value={country.slug} label={country.name}>
                                {country.name}
                            </Option>
                        ))}
                    </Select>
                </Panel>

                <Panel header={<Text strong>Năm phát hành</Text>} key="years">
                    <Select
                        mode="multiple"
                        className="filter-select"
                        placeholder="Chọn năm phát hành"
                        value={getFilterValue('years')}
                        onChange={(value) => handleFilterChange('years', value)}
                        allowClear
                        onClear={() => handleFilterChange('years', undefined)}
                        maxTagCount={isMobile ? 1 : 3}
                    >
                        {yearOptions.map((year) => (
                            <Option key={year} value={year.toString()}>
                                {year}
                            </Option>
                        ))}
                    </Select>
                </Panel>

                <Panel header={<Text strong>Trạng thái</Text>} key="status">
                    <div className="filter-chip-group">
                        {statusOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`filter-chip ${
                                    getFilterValue('status')[0] === option.value ? 'active' : ''
                                }`}
                                onClick={() => {
                                    const currentValue = getFilterValue('status')[0];
                                    handleFilterChange(
                                        'status',
                                        currentValue === option.value ? undefined : option.value,
                                    );
                                }}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                </Panel>

                <Panel header={<Text strong>Tùy chọn khác</Text>} key="other">
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Checkbox
                            checked={getFilterValue('cinemaRelease')[0]?.toString() === 'true'}
                            onChange={(e) => handleFilterChange('cinemaRelease', e.target.checked)}
                            className="filter-checkbox"
                        >
                            Phim chiếu rạp
                        </Checkbox>

                        <Checkbox
                            checked={getFilterValue('isCopyright')[0]?.toString() === 'true'}
                            onChange={(e) => handleFilterChange('isCopyright', e.target.checked)}
                            className="filter-checkbox"
                        >
                            Phim bản quyền
                        </Checkbox>
                    </Space>
                </Panel>
            </Collapse>
        </div>
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
                            label = 'Năm';
                            break;
                        case 'categories':
                            label = 'Thể loại';
                            displayValue =
                                categories?.find((cat) => cat.slug === value)?.name || value;
                            break;
                        case 'countries':
                            label = 'Quốc gia';
                            displayValue =
                                regions?.find((reg) => reg.slug === value)?.name || value;
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
                                className="filter-tag"
                                onClose={() => {
                                    const newValues = values.filter((v) => v !== value);
                                    handleFilterChange(
                                        filter.field,
                                        newValues.length ? newValues : undefined,
                                    );
                                }}
                            >
                                <span className="filter-tag-label">{label}:</span>
                                <span className="filter-tag-content">{displayValue}</span>
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

    // Copilot readable values
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
            (slug) => categories?.find((cat) => cat.slug === slug)?.name || slug,
        ),
        description: 'Full names of selected movie categories/genres',
        categories: ['display-names', 'genres'],
        parentId: 'movie-display',
        convert: (description, value) => (Array.isArray(value) ? value.join(', ') : String(value)),
    });

    useCopilotReadable({
        value: getFilterValue('countries').map(
            (slug) => regions?.find((reg) => reg.slug === slug)?.name || slug,
        ),
        description: 'Full names of selected countries/regions',
        categories: ['display-names', 'geographical-data'],
        parentId: 'movie-display',
        convert: (description, value) => (Array.isArray(value) ? value.join(', ') : String(value)),
    });

    // Filter content for both Modal and Drawer
    const filterContent = (
        <>
            <div style={{ padding: '0 var(--filter-spacing-lg)' }}>{renderFilterForm()}</div>
            <div className="filter-drawer-footer">
                <Button
                    className="filter-button filter-reset-button"
                    onClick={clearAllFilters}
                    icon={<CloseOutlined />}
                >
                    Xóa bộ lọc
                </Button>
                <Button
                    type="primary"
                    className="filter-button filter-apply-button"
                    onClick={() => {
                        setFilterVisible(false);
                        applySearch(query);
                    }}
                    icon={<SearchOutlined />}
                >
                    Áp dụng
                    {movieCountData !== undefined && (
                        <span className="results-count">{movieCountData}</span>
                    )}
                </Button>
            </div>
        </>
    );

    return (
        <div className="filters-container">
            <Row gutter={[16, 16]} align="top" className="filter-row">
                <Col xs={24} md={16} lg={16}>
                    <Card bordered={false} className="search-card">
                        <Row gutter={[8, 8]}>
                            <Col span={24}>
                                <SearchInput
                                    value={keywordsInput}
                                    onChange={setKeywordsInput}
                                    onSearch={(value) => {
                                        const newFilters = handleFilterChange(
                                            'keywords',
                                            value || undefined,
                                        );
                                        applySearch({ ...query, filters: newFilters });
                                    }}
                                    isAIMode={getFilterValue('useAI')[0]?.toString() === 'true'}
                                    loading={isSearching}
                                    placeholder="Tìm phim theo tên phim, diễn viên, đạo diễn hoặc nội dung"
                                    aiPlaceholder="Mô tả chi tiết phim bạn muốn tìm (ví dụ: phim về phép thuật)"
                                />
                            </Col>
                            <Col span={24} style={{ paddingTop: '0.5rem' }}>
                                <Row align="middle" justify="space-between">
                                    <Col>
                                        <Space size="small">
                                            <Badge
                                                dot
                                                status={
                                                    getFilterValue('useAI')[0]?.toString() ===
                                                    'true'
                                                        ? 'processing'
                                                        : 'default'
                                                }
                                                offset={[0, 0]}
                                            >
                                                <Switch
                                                    size="small"
                                                    checked={
                                                        getFilterValue('useAI')[0]?.toString() ===
                                                        'true'
                                                    }
                                                    onChange={(checked) =>
                                                        handleFilterChange('useAI', checked)
                                                    }
                                                    checkedChildren={<RobotOutlined />}
                                                    unCheckedChildren={<SearchOutlined />}
                                                />
                                            </Badge>
                                            <Text
                                                type={
                                                    getFilterValue('useAI')[0]?.toString() ===
                                                    'true'
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                                strong={
                                                    getFilterValue('useAI')[0]?.toString() ===
                                                    'true'
                                                }
                                                style={{ fontSize: '0.875rem' }}
                                            >
                                                Tìm kiếm với AI
                                            </Text>
                                            <Tooltip title="Nhập mô tả chi tiết về nội dung, cảnh phim hoặc cảm xúc bạn muốn tìm. AI sẽ giúp bạn tìm những bộ phim phù hợp.">
                                                <QuestionCircleOutlined
                                                    style={{
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                    }}
                                                />
                                            </Tooltip>
                                        </Space>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col xs={10} md={4} lg={3}>
                    <Select
                        placeholder="Xắp xếp theo"
                        className="filter-select"
                        value={
                            query?.sorters?.[0]?.field && query?.sorters?.[0]?.order
                                ? `${query?.sorters?.[0]?.field},${query?.sorters?.[0]?.order}`
                                : 'view,desc'
                        }
                        onChange={handleSorterChange}
                        suffixIcon={<SortAscendingOutlined />}
                        size={isMobile ? 'middle' : 'large'}
                    >
                        {sortOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                                {option.label}
                            </Option>
                        ))}
                    </Select>
                </Col>

                <Col xs={10} md={4} lg={3}>
                    <Badge
                        count={getActiveFilterCount()}
                        size="small"
                        offset={[-5, 5]}
                        className="filter-button-badge"
                    >
                        <Button
                            onClick={() => setFilterVisible(true)}
                            icon={<FilterOutlined />}
                            className="filter-button"
                            aria-label="Mở bộ lọc"
                            block
                            size={isMobile ? 'middle' : 'large'}
                            type="primary"
                            ghost
                        >
                            Bộ lọc {!isMobile && 'nâng cao'}
                        </Button>
                    </Badge>
                </Col>
            </Row>

            {renderFilterTags().length > 0 && (
                <div className="filter-tags-container">
                    {renderFilterTags()}
                    {renderFilterTags().length > 0 && (
                        <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={clearAllFilters}
                            className="filter-tag"
                        >
                            Xóa tất cả
                        </Button>
                    )}
                </div>
            )}

            {/* Use conditional rendering instead of dynamic component */}
            {isMobile ? (
                <Modal
                    open={filterVisible}
                    onCancel={() => setFilterVisible(false)}
                    footer={null}
                    title="Bộ lọc nâng cao"
                    bodyStyle={{ padding: 0, height: '80vh', overflowY: 'auto' }}
                    className="filter-modal"
                >
                    {filterContent}
                </Modal>
            ) : (
                <Drawer
                    open={filterVisible}
                    onClose={() => setFilterVisible(false)}
                    title="Bộ lọc nâng cao"
                    placement="right"
                    width={md ? 380 : 320}
                    className="filter-drawer"
                    bodyStyle={{ padding: 0 }}
                >
                    {filterContent}
                </Drawer>
            )}
        </div>
    );
};
