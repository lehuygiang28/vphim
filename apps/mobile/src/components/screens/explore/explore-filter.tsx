import React, { useState, useCallback } from 'react';
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
import { useList, LogicalFilter, CrudSorting } from '@refinedev/core';
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
    applySearch: (newQuery: MovieFiltersProps['query']) => void;
    isSearching: boolean;
}

const sortOptions = [
    { value: 'bestMatch,asc', label: 'Best Match' },
    { value: 'view,desc', label: 'Most Popular' },
    { value: 'year,desc', label: 'Newest' },
    { value: 'year,asc', label: 'Oldest' },
    { value: 'updatedAt,desc', label: 'Recently Updated' },
];

const statusOptions = [
    { value: 'trailer', label: 'Trailer' },
    { value: 'completed', label: 'Completed' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'updating', label: 'Updating' },
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
    const [localFilters, setLocalFilters] = useState<LogicalFilter[]>(query.filters || []);
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
            const filter = localFilters.find((x) => x.field === field);
            if (field === 'type') {
                return filter ? [filter.value.toString()] : [];
            }
            return filter ? filter.value.toString().split(',') : [];
        },
        [localFilters],
    );

    const handleFilterChange = (key: string, value: any) => {
        setLocalFilters((prev) => {
            const newFilters = prev.filter((x) => x.field !== key);
            if (value !== undefined && value !== null && value.toString().trim() !== '') {
                newFilters.push({
                    field: key,
                    value: Array.isArray(value) ? value.join(',') : value,
                    operator: Array.isArray(value) ? 'in' : 'eq',
                });
            }
            return newFilters;
        });
    };

    const debouncedSearch = useDebouncedCallback((value: string) => {
        handleFilterChange('keywords', value);
        applySearch({ ...query, filters: localFilters });
    }, debounceDelay);

    const handleApplyFilters = () => {
        setQuery((prev) => ({
            ...prev,
            filters: localFilters,
            pagination: { ...prev.pagination, current: 1 },
        }));
        setModalVisible(false);
        applySearch({ ...query, filters: localFilters });
    };

    const handleClearAllFilters = () => {
        setLocalFilters([]);
    };

    const renderFilterModal = () => (
        <Modal
            style={{ width: '90%' }}
            visible={modalVisible}
            backdropStyle={styles.backdrop}
            onBackdropPress={() => setModalVisible(false)}
        >
            <Card disabled style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <Text category="h6">Filters</Text>
                    <Button
                        appearance="ghost"
                        status="basic"
                        accessoryLeft={(props) => <X {...removeStyleProperty(props)} />}
                        onPress={() => setModalVisible(false)}
                    />
                </View>
                <Divider />
                <ScrollView style={styles.modalContent}>
                    <Select
                        size="small"
                        label="Movie Type"
                        placeholder="Select movie type"
                        value={
                            movieTypeTranslations[
                                getFilterValue('type')[0] as keyof typeof movieTypeTranslations
                            ]
                        }
                        onSelect={(index) => {
                            const selectedIndex = (index as IndexPath).row;
                            const selectedType = Object.keys(movieTypeTranslations)[selectedIndex];
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
                        label="Release Year"
                        placeholder="Select release year"
                        selectedIndex={getFilterValue('years')
                            .map((year) => yearOptions.findIndex((option) => option.value === year))
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
                        label="Categories"
                        placeholder="Select categories"
                        selectedIndex={getFilterValue('categories')
                            .map((slug) => categories?.data?.findIndex((c) => c.slug === slug))
                            .filter((index): index is number => index !== undefined && index !== -1)
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
                        label="Countries"
                        placeholder="Select countries"
                        selectedIndex={getFilterValue('countries')
                            .map((slug) => regions?.data?.findIndex((r) => r.slug === slug))
                            .filter((index): index is number => index !== undefined && index !== -1)
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
                        label="Status"
                        placeholder="Select status"
                        value={
                            movieStatusTranslations[
                                getFilterValue('status')[0] as keyof typeof movieStatusTranslations
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
                        Cinema Release
                    </CheckBox>

                    <CheckBox
                        checked={getFilterValue('isCopyright')[0] === 'true'}
                        onChange={(checked) => handleFilterChange('isCopyright', checked)}
                        style={styles.checkbox}
                    >
                        Copyright
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
                        Clear
                    </Button>
                    <Button onPress={handleApplyFilters} style={styles.applyButton} size="small">
                        Apply
                    </Button>
                </View>
            </Card>
        </Modal>
    );

    const renderAIButton = () => (
        <Tooltip
            anchor={() => (
                <TouchableOpacity
                    style={[styles.aiButton]}
                    onPress={() => {
                        const newAiState = !isAiEnabled;
                        setIsAiEnabled(newAiState);
                        handleFilterChange('useAI', newAiState);
                        // Update debounce time
                        setDebounceDelay(newAiState ? AI_DEBOUNCE_TIME : NORMAL_DEBOUNCE_TIME);
                    }}
                    onLongPress={() => setTooltipVisible(true)}
                >
                    <Sparkle
                        size={24}
                        color={isAiEnabled ? theme['color-primary-500'] : theme['color-basic-600']}
                        fill={isAiEnabled ? theme['color-primary-500'] : theme['color-basic-600']}
                    />
                </TouchableOpacity>
            )}
            visible={tooltipVisible}
            onBackdropPress={() => setTooltipVisible(false)}
        >
            <Text style={styles.tooltipText}>
                {isAiEnabled ? 'AI-powered search enabled (slower)' : 'Enable AI-powered search'}
            </Text>
        </Tooltip>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchRow}>
                <Input
                    placeholder="Search movies"
                    accessoryLeft={(props) => <Search {...removeStyleProperty(props)} />}
                    onChangeText={debouncedSearch}
                    style={styles.searchInput}
                />
                {renderAIButton()}
            </View>
            <View style={styles.filterRow}>
                <Select
                    placeholder="Sort by"
                    onSelect={(index) => {
                        const selectedIndex = (index as IndexPath).row;
                        const [field, _order] = sortOptions[selectedIndex].value.split(',');
                        const order = _order?.toString()?.toLowerCase() === 'asc' ? 'asc' : 'desc';
                        setQuery((prev) => ({
                            ...prev,
                            sorters: [{ field, order }],
                            pagination: { ...prev.pagination, current: 1 },
                        }));
                        applySearch({
                            ...query,
                            sorters: [{ field, order }],
                        });
                    }}
                    style={styles.sortSelect}
                >
                    {sortOptions.map((option, index) => (
                        <SelectItem key={index} title={option.label} />
                    ))}
                </Select>
                <Button
                    accessoryLeft={(props) => <Filter {...removeStyleProperty(props)} />}
                    onPress={() => setModalVisible(true)}
                    style={styles.filterButton}
                >
                    Filters
                </Button>
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
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sortSelect: {
        flex: 1,
        marginRight: 8,
    },
    filterButton: {
        height: 40,
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
    aiButton: {
        padding: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tooltipText: {
        color: 'white',
        fontSize: 14,
        padding: 8,
    },
});
