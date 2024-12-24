import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import {
    Input,
    Button,
    Select,
    SelectItem,
    Modal,
    Card,
    CheckBox,
    useTheme,
    IndexPath,
    Text,
    Divider,
    Tooltip,
} from '@ui-kitten/components';
import { Search, Filter, X, Sparkle } from 'lucide-react-native';
import { useList, LogicalFilter, CrudSorting, CrudSort } from '@refinedev/core';
import { useDebouncedCallback } from 'use-debounce';

import { Category } from '~api/app/categories/category.schema';
import { Region } from '~api/app/regions/region.schema';
import { CATEGORIES_LIST_QUERY } from '~fe/queries/categories';
import { REGIONS_LIST_QUERY } from '~fe/queries/regions';
import { movieTypeTranslations, movieStatusTranslations } from '~fe/constants/translation-enum';
import { removeStyleProperty, sortAlphabetNumberLast } from '~mb/libs/utils';

interface MovieFiltersProps {
    query: {
        filters: LogicalFilter[];
        sorters: CrudSorting;
        pagination: { current: number; pageSize: number };
    };
    setQuery: React.Dispatch<React.SetStateAction<MovieFiltersProps['query']>>;
    applySearch: (newQuery?: MovieFiltersProps['query']) => void;
    isSearching: boolean;
}

const sortOptions = [
    { value: 'bestMatch,asc', label: 'Độ phù hợp' },
    { value: 'view,desc', label: 'Xem nhiều nhất' },
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

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 124 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
}));

const AI_DEBOUNCE_TIME = 2000; // 2 second for AI-powered search
const NORMAL_DEBOUNCE_TIME = 500; // 0.5 seconds for normal search

export const MovieFilters: React.FC<MovieFiltersProps> = ({
    query,
    setQuery,
    applySearch,
    isSearching,
}) => {
    const theme = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [isAiEnabled, setIsAiEnabled] = useState(false);
    const [tooltipVisible, setTooltipVisible] = useState(false);
    const [debounceDelay, setDebounceDelay] = useState(NORMAL_DEBOUNCE_TIME);

    const { data: categories } = useList<Category>({
        resource: 'categories',
        dataProviderName: 'graphql',
        meta: { gqlQuery: CATEGORIES_LIST_QUERY },
        pagination: { current: 1, pageSize: 500 },
        errorNotification: false,
        successNotification: false,
    });

    const { data: regions } = useList<Region>({
        resource: 'regions',
        dataProviderName: 'graphql',
        meta: { gqlQuery: REGIONS_LIST_QUERY },
        pagination: { current: 1, pageSize: 500 },
        errorNotification: false,
        successNotification: false,
    });

    const getFilterValue = useCallback(
        (field: string): string[] => {
            const filter = query.filters.find((x) => x.field === field);
            if (field === 'type') {
                return filter ? [filter.value.toString()] : [];
            }
            return filter ? filter.value.toString().split(',') : [];
        },
        [query.filters],
    );

    const handleFilterChange = useCallback(
        (key: string, value: any) => {
            setQuery((prev) => {
                const newFilters = prev.filters.filter((x) => x.field !== key);
                if (value !== undefined && value !== null && value.toString().trim() !== '') {
                    newFilters.push({
                        field: key,
                        value: Array.isArray(value) ? value.join(',') : value,
                        operator: Array.isArray(value) ? 'in' : 'eq',
                    });
                }
                return { ...prev, filters: newFilters };
            });
        },
        [setQuery],
    );

    const handleSorterChange = useCallback(
        (value: string) => {
            const [val, ord] = value?.split(',') || [];
            const sorters: CrudSort[] = val
                ? [{ field: val, order: ord === 'asc' ? 'asc' : 'desc' }]
                : [];
            setQuery((prev) => ({
                ...prev,
                sorters,
                pagination: { ...prev?.pagination, current: 1 },
            }));
            applySearch({ ...query, sorters, pagination: { ...query.pagination, current: 1 } });
        },
        [applySearch, query, setQuery],
    );

    const handleApplyFilters = useCallback(() => {
        setQuery((prev) => ({ ...prev, pagination: { ...prev.pagination, current: 1 } }));
        setModalVisible(false);
        applySearch();
    }, [applySearch, setQuery]);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        handleFilterChange('keywords', value);
    }, debounceDelay);

    const handleClearAllFilters = useCallback(() => {
        setQuery((prev) => ({
            ...prev,
            filters: [],
            sorters: [],
            pagination: { ...prev.pagination, current: 1 },
        }));
    }, [setQuery]);

    const renderFilterModal = useCallback(
        () => (
            <Modal
                style={{ width: '95%' }}
                visible={modalVisible}
                backdropStyle={styles.backdrop}
                onBackdropPress={() => setModalVisible(false)}
            >
                <Card disabled style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text category="h6">Bộ lọc</Text>
                        <Button
                            appearance="ghost"
                            status="basic"
                            accessoryLeft={(props) => <X {...removeStyleProperty(props)} />}
                            onPress={() => setModalVisible(false)}
                        ></Button>
                    </View>
                    <Divider />
                    <ScrollView style={styles.modalContent}>
                        <Select
                            size="small"
                            label="Định dạng phim"
                            placeholder="Chọn định dạng phim"
                            value={
                                movieTypeTranslations[
                                    getFilterValue('type')[0] as keyof typeof movieTypeTranslations
                                ]
                            }
                            onSelect={(index) => {
                                const selectedIndex = (index as IndexPath).row;
                                const selectedType =
                                    Object.keys(movieTypeTranslations)[selectedIndex];
                                handleFilterChange('type', selectedType);
                            }}
                            style={styles.select}
                        >
                            {Object.entries(movieTypeTranslations).map(([key, value], index) => (
                                <SelectItem key={index} title={value} />
                            ))}
                        </Select>

                        <Select
                            size="small"
                            label="Năm phát hành"
                            placeholder="Chọn năm phát hành"
                            selectedIndex={getFilterValue('years')
                                .map((year) =>
                                    yearOptions.findIndex((option) => option.value === year),
                                )
                                .filter((index): index is number => index !== -1)
                                .map((index) => new IndexPath(index))}
                            value={getFilterValue('years').join(', ')}
                            onSelect={(indices) => {
                                const selectedYears = (indices as IndexPath[]).map(
                                    (index) => yearOptions[index.row].value,
                                );
                                handleFilterChange('years', selectedYears);
                            }}
                            style={styles.select}
                            multiSelect
                        >
                            {yearOptions.map((option, index) => (
                                <SelectItem key={option.value} title={option.label} />
                            ))}
                        </Select>

                        <Select
                            size="small"
                            label="Thể loại"
                            placeholder="Chọn thể loại"
                            selectedIndex={getFilterValue('categories')
                                .map((slug) => categories?.data?.findIndex((c) => c.slug === slug))
                                .filter(
                                    (index): index is number => index !== undefined && index !== -1,
                                )
                                .map((index) => new IndexPath(index))}
                            value={getFilterValue('categories')
                                .map((slug) => categories?.data?.find((c) => c.slug === slug)?.name)
                                .filter(Boolean)
                                .join(', ')}
                            onSelect={(indices) => {
                                const selectedCategories = (indices as IndexPath[]).map(
                                    (index) => categories?.data?.[index.row].slug ?? '',
                                );
                                handleFilterChange('categories', selectedCategories);
                            }}
                            style={styles.select}
                            multiSelect
                        >
                            {categories?.data
                                ?.slice()
                                .sort((_a, _b) => sortAlphabetNumberLast(_a, _b))
                                .map((category, index) => (
                                    <SelectItem key={category.slug} title={category.name} />
                                ))}
                        </Select>

                        <Select
                            size="small"
                            label="Quốc gia"
                            placeholder="Chọn quốc gia"
                            selectedIndex={getFilterValue('countries')
                                .map((slug) => regions?.data?.findIndex((r) => r.slug === slug))
                                .filter(
                                    (index): index is number => index !== undefined && index !== -1,
                                )
                                .map((index) => new IndexPath(index))}
                            value={getFilterValue('countries')
                                .map((slug) => regions?.data?.find((r) => r.slug === slug)?.name)
                                .filter(Boolean)
                                .join(', ')}
                            onSelect={(indices) => {
                                const selectedCountries = (indices as IndexPath[]).map(
                                    (index) => regions?.data?.[index.row].slug ?? '',
                                );
                                handleFilterChange('countries', selectedCountries);
                            }}
                            style={styles.select}
                            multiSelect
                        >
                            {regions?.data
                                ?.slice()
                                .sort((_a, _b) => sortAlphabetNumberLast(_a, _b))
                                .map((region, index) => (
                                    <SelectItem key={region.slug} title={region.name} />
                                ))}
                        </Select>

                        <Select
                            size="small"
                            label="Trạng thái"
                            placeholder="Chọn trạng thái"
                            value={
                                movieStatusTranslations[
                                    getFilterValue(
                                        'status',
                                    )[0] as keyof typeof movieStatusTranslations
                                ]
                            }
                            onSelect={(index) => {
                                const selectedIndex = (index as IndexPath).row;
                                handleFilterChange('status', statusOptions[selectedIndex].value);
                            }}
                            style={styles.select}
                        >
                            {statusOptions.map((option, index) => (
                                <SelectItem key={index} title={option.label} />
                            ))}
                        </Select>

                        <CheckBox
                            checked={getFilterValue('cinemaRelease')[0] === 'true'}
                            onChange={(checked) => handleFilterChange('cinemaRelease', checked)}
                            style={styles.checkbox}
                        >
                            Phim chiếu rạp
                        </CheckBox>

                        <CheckBox
                            checked={getFilterValue('isCopyright')[0] === 'true'}
                            onChange={(checked) => handleFilterChange('isCopyright', checked)}
                            style={styles.checkbox}
                        >
                            Có bản quyền
                        </CheckBox>
                    </ScrollView>
                    <Divider />
                    <View style={styles.modalFooter}>
                        <Button
                            appearance="ghost"
                            status="basic"
                            onPress={handleClearAllFilters}
                            style={styles.clearButton}
                            size="small"
                        >
                            Xóa hết
                        </Button>
                        <Button
                            onPress={handleApplyFilters}
                            style={styles.applyButton}
                            size="small"
                        >
                            Áp dụng
                        </Button>
                    </View>
                </Card>
            </Modal>
        ),
        [
            categories?.data,
            getFilterValue,
            handleApplyFilters,
            handleClearAllFilters,
            handleFilterChange,
            modalVisible,
            movieStatusTranslations,
            movieTypeTranslations,
            regions?.data,
            theme,
            yearOptions,
        ],
    );

    const handleToggleAi = useCallback(() => {
        const newAiState = !isAiEnabled;
        setIsAiEnabled(newAiState);
        handleFilterChange('useAI', newAiState);
        setDebounceDelay(newAiState ? AI_DEBOUNCE_TIME : NORMAL_DEBOUNCE_TIME);
    }, [handleFilterChange, isAiEnabled, setDebounceDelay]);

    const renderAIButton = useCallback(
        () => (
            <Tooltip
                anchor={() => (
                    <TouchableOpacity
                        style={[styles.actionButton]}
                        onPress={handleToggleAi}
                        onLongPress={() => setTooltipVisible(true)}
                    >
                        <Sparkle
                            size={24}
                            color={
                                isAiEnabled ? theme['color-primary-500'] : theme['color-basic-600']
                            }
                            fill={
                                isAiEnabled ? theme['color-primary-500'] : theme['color-basic-600']
                            }
                        />
                    </TouchableOpacity>
                )}
                visible={tooltipVisible}
                onBackdropPress={() => setTooltipVisible(false)}
            >
                <Text style={styles.tooltipText}>
                    {isAiEnabled ? 'Tìm kiếm với AI' : 'Bật tìm kiếm với AI'}
                </Text>
            </Tooltip>
        ),
        [handleToggleAi, isAiEnabled, theme, tooltipVisible],
    );

    const hasActiveFiltersCount = useMemo(
        () => query.filters.filter((f) => f.field !== 'useAI').length,
        [query.filters],
    );
    const renderFilterButton = useCallback(
        () => (
            <Tooltip
                anchor={() => (
                    <TouchableOpacity
                        style={[styles.actionButton]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Filter
                            size={20}
                            color={
                                hasActiveFiltersCount > 0
                                    ? theme['color-primary-500']
                                    : theme['color-basic-600']
                            }
                        />
                        {hasActiveFiltersCount > 0 && (
                            <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{hasActiveFiltersCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
                placement="bottom"
            >
                <Text>Lọc phim{hasActiveFiltersCount > 0 ? ` (Đang lọc)` : ''}</Text>
            </Tooltip>
        ),
        [hasActiveFiltersCount, theme],
    );

    const handleSearch = useCallback(
        (value: string) => {
            debouncedSearch(value);
        },
        [debouncedSearch],
    );

    const handleSearchEnter = useCallback(() => {
        handleApplyFilters();
    }, [handleApplyFilters]);

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <Input
                    placeholder="Tìm kiếm phim"
                    accessoryLeft={(props) => <Search {...removeStyleProperty(props)} />}
                    onChangeText={handleSearch}
                    style={styles.searchInput}
                    onKeyPress={(e) => {
                        if (e.nativeEvent.key === 'Enter') {
                            handleSearchEnter();
                        }
                    }}
                />
            </View>
            <View style={styles.filterRow}>
                <Select
                    placeholder="Sắp xếp theo"
                    value={
                        sortOptions.find(
                            (option) =>
                                option.value ===
                                `${query.sorters[0]?.field},${query.sorters[0]?.order}`,
                        )?.label || 'Sắp xếp theo'
                    }
                    onSelect={(index) => {
                        const selectedIndex = (index as IndexPath).row;
                        handleSorterChange(sortOptions[selectedIndex].value);
                    }}
                    style={styles.sortSelect}
                >
                    {sortOptions.map((option, index) => (
                        <SelectItem key={option.value} title={option.label} />
                    ))}
                </Select>
                {renderAIButton()}
                {renderFilterButton()}
            </View>
            {renderFilterModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginRight: 8,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 16,
    },
    sortSelect: {
        flex: 1,
        marginRight: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    filterBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'red',
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: 'white',
        fontSize: 9,
        fontWeight: 'bold',
    },
    backdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCard: {
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    modalContent: {
        paddingVertical: 16,
    },
    modalFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    select: {
        marginBottom: 16,
    },
    checkbox: {
        marginBottom: 16,
    },
    clearButton: {
        flex: 1,
        marginRight: 8,
    },
    applyButton: {
        flex: 1,
        marginLeft: 8,
    },
    tooltipText: {
        color: 'white',
        fontSize: 14,
        padding: 8,
    },
});
