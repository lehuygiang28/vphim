import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
    Modal,
    Portal,
    Button,
    Checkbox,
    RadioButton,
    Text,
    useTheme,
    Searchbar,
} from 'react-native-paper';
import { CrudFilters, CrudSort, LogicalFilter, useSelect } from '@refinedev/core';
import { CategoryType } from '~api/app/categories';
import { RegionType } from '~api/app/regions/region.type';
import { MNT_CATEGORIES_LIST_QUERY } from '~mnt/queries/category.query';
import { MNT_REGIONS_LIST_QUERY } from '~mnt/queries/region.query';
import { movieTypeTranslations } from '@/constants/translation-enum';

interface FilterModalProps {
    visible: boolean;
    onDismiss: () => void;
    onApply: (filters: CrudFilters, sorter: CrudSort | null) => void;
    initialFilters: CrudFilters;
    initialSorter: CrudSort | null;
}

const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onDismiss,
    onApply,
    initialFilters,
    initialSorter,
}) => {
    const theme = useTheme();
    const [filters, setFilters] = useState<CrudFilters>(initialFilters);
    const [sorter, setSorter] = useState<CrudSort | null>(initialSorter);
    const [categorySearch, setCategorySearch] = useState('');
    const [regionSearch, setRegionSearch] = useState('');

    const { options: categories } = useSelect<CategoryType>({
        dataProviderName: 'graphql',
        resource: 'categories',
        optionLabel: 'name',
        optionValue: '_id',
        meta: {
            gqlQuery: MNT_CATEGORIES_LIST_QUERY,
            operation: 'categories',
        },
        debounce: 500,
        errorNotification: false,
        successNotification: false,
        onSearch: (value) => [
            {
                field: 'keywords',
                operator: 'contains',
                value: value,
            },
        ],
    });

    const { options: regions } = useSelect<RegionType>({
        dataProviderName: 'graphql',
        resource: 'regions',
        optionLabel: 'name',
        optionValue: '_id',
        meta: {
            gqlQuery: MNT_REGIONS_LIST_QUERY,
            operation: 'regions',
        },
        debounce: 500,
        errorNotification: false,
        successNotification: false,
        onSearch: (value) => [
            {
                field: 'keywords',
                operator: 'contains',
                value: value,
            },
        ],
    });

    const handleFilterChange = useCallback((field: string, value: string[]) => {
        setFilters((prevFilters) => {
            const newFilters = prevFilters.filter((f) => (f as LogicalFilter).field !== field);
            if (value.length > 0) {
                newFilters.push({ field, operator: 'in', value });
            }
            return newFilters;
        });
    }, []);

    const handleSorterChange = useCallback((field: string, order: 'asc' | 'desc') => {
        setSorter({ field, order });
    }, []);

    const getFilterValue = useCallback(
        (field: string) => {
            const filter = filters.find((f) => (f as LogicalFilter).field === field);
            return (filter?.value as string[]) || [];
        },
        [filters],
    );

    const filteredCategories = categories.filter((category) =>
        category.label.toLowerCase().includes(categorySearch.toLowerCase()),
    );

    const filteredRegions = regions.filter((region) =>
        region.label.toLowerCase().includes(regionSearch.toLowerCase()),
    );

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={[
                    styles.modalContainer,
                    { backgroundColor: theme.colors.surface },
                ]}
            >
                <ScrollView>
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                        Filters
                    </Text>
                    <FilterSection
                        title="Movie Type"
                        options={Object.entries(movieTypeTranslations).map(([key, value]) => ({
                            key,
                            value,
                            label: key,
                        }))}
                        selected={getFilterValue('type')}
                        onChange={(value) => handleFilterChange('type', value)}
                    />
                    <FilterSection
                        title="Categories"
                        options={filteredCategories?.map((category) => ({
                            key: category.label,
                            value: category.label,
                        }))}
                        selected={getFilterValue('categories')}
                        onChange={(value) => handleFilterChange('categories', value)}
                        searchValue={categorySearch}
                        onSearchChange={setCategorySearch}
                    />
                    <FilterSection
                        title="Countries"
                        options={filteredRegions?.map((region) => ({
                            key: region.label,
                            value: region.value,
                        }))}
                        selected={getFilterValue('countries')}
                        onChange={(value) => handleFilterChange('countries', value)}
                        searchValue={regionSearch}
                        onSearchChange={setRegionSearch}
                    />
                    <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                        Sort By
                    </Text>
                    <RadioButton.Group
                        onValueChange={(value) =>
                            handleSorterChange(
                                value.split(',')[0],
                                value.split(',')[1] as 'asc' | 'desc',
                            )
                        }
                        value={`${sorter?.field},${sorter?.order}`}
                    >
                        <RadioButton.Item label="Most Popular" value="view,desc" />
                        <RadioButton.Item label="Newest" value="year,desc" />
                        <RadioButton.Item label="Oldest" value="year,asc" />
                        <RadioButton.Item label="Recently Updated" value="updatedAt,desc" />
                    </RadioButton.Group>
                </ScrollView>
                <View style={styles.buttonContainer}>
                    <Button onPress={onDismiss} style={styles.button}>
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => onApply(filters, sorter)}
                        style={styles.button}
                    >
                        Apply
                    </Button>
                </View>
            </Modal>
        </Portal>
    );
};

const FilterSection: React.FC<{
    title: string;
    options: { key: string; value: string }[];
    selected: string[];
    onChange: (value: string[]) => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}> = ({ title, options, selected, onChange, searchValue, onSearchChange }) => {
    return (
        <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{title}</Text>
            {onSearchChange && (
                <Searchbar
                    placeholder={`Search ${title}`}
                    onChangeText={onSearchChange}
                    value={searchValue || ''}
                    style={styles.searchBar}
                />
            )}
            <ScrollView style={styles.optionsContainer}>
                {options.map((option) => (
                    <Checkbox.Item
                        key={option.key}
                        label={option.value}
                        status={selected.includes(option.key) ? 'checked' : 'unchecked'}
                        onPress={() => {
                            const newSelected = selected.includes(option.key)
                                ? selected.filter((s) => s !== option.key)
                                : [...selected, option.key];
                            onChange(newSelected);
                        }}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        margin: 20,
        padding: 20,
        borderRadius: 8,
        maxHeight: '80%',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    filterSection: {
        marginBottom: 20,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    optionsContainer: {
        maxHeight: 200,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    button: {
        marginLeft: 10,
    },
    searchBar: {
        marginBottom: 10,
    },
});

export default FilterModal;
