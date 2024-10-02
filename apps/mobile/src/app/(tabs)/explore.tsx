import React, { useState, useCallback, useRef } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Searchbar, Chip, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { useInfiniteList, CrudFilters, CrudSort, LogicalFilter } from '@refinedev/core';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieCard } from '~mb/components/card/movie-card';
import { MovieType } from '~api/app/movies/movie.type';
import debounce from 'lodash.debounce';
import FilterModal from '../../components/modal/movie-filter';

const ExploreScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const { searchQuery: initialSearchQuery } = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState((initialSearchQuery as string) || '');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<CrudFilters>([]);
    const [appliedSorter, setAppliedSorter] = useState<CrudSort | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useInfiniteList<MovieType>({
            resource: 'movies',
            dataProviderName: 'graphql',
            meta: {
                gqlQuery: MOVIES_LIST_QUERY,
            },
            pagination: {
                pageSize: 20,
            },
            filters: appliedFilters,
            sorters: appliedSorter ? [appliedSorter] : undefined,
            errorNotification: false,
            successNotification: false,
        });

    const handleSearch = useCallback(
        debounce((query: string) => {
            setIsSearching(true);
            const newFilters: CrudFilters = [
                { field: 'keywords', operator: 'contains', value: query },
                ...appliedFilters.filter(
                    (filter) => (filter as LogicalFilter).field !== 'keywords',
                ),
            ];
            setAppliedFilters(newFilters);
            flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
            setIsSearching(false);
        }, 300),
        [appliedFilters],
    );

    const handleFilterApply = (filters: CrudFilters, sorter: CrudSort | null) => {
        setAppliedFilters(filters);
        setAppliedSorter(sorter);
        setFilterModalVisible(false);
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
    };

    const renderMovieItem = useCallback(
        ({ item }: { item: MovieType }) => (
            <MovieCard movie={item} onPress={() => router.push(`/movie/${item.slug}`)} />
        ),
        [router],
    );

    const keyExtractor = useCallback((item: MovieType) => `${item?._id?.toString()}`, []);

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator animating={true} color={theme.colors.primary} />
            </View>
        );
    };

    if (isError) {
        return (
            <View style={styles.centerContainer}>
                <Text>An error occurred while fetching movies.</Text>
            </View>
        );
    }

    const allMovies = data?.pages.flatMap((page) => page.data) || [];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder="Search movies"
                onChangeText={(query) => {
                    setSearchQuery(query);
                    handleSearch(query);
                }}
                value={searchQuery}
                style={styles.searchBar}
            />
            <View style={styles.filterContainer}>
                <Button
                    mode="outlined"
                    onPress={() => setFilterModalVisible(true)}
                    icon="filter-variant"
                    style={styles.filterButton}
                >
                    Filters
                </Button>
                {appliedFilters.length > 0 && (
                    <Chip onClose={() => handleFilterApply([], null)} style={styles.filterChip}>
                        {appliedFilters.length} filter{appliedFilters.length > 1 ? 's' : ''} applied
                    </Chip>
                )}
            </View>
            {isLoading || isSearching ? (
                <ActivityIndicator
                    animating={true}
                    color={theme.colors.primary}
                    style={styles.loader}
                />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={allMovies}
                    renderItem={renderMovieItem}
                    keyExtractor={keyExtractor}
                    numColumns={2}
                    contentContainerStyle={styles.movieList}
                    onEndReached={() => {
                        if (hasNextPage) {
                            fetchNextPage();
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
            )}
            <FilterModal
                visible={isFilterModalVisible}
                onDismiss={() => setFilterModalVisible(false)}
                onApply={handleFilterApply}
                initialFilters={appliedFilters}
                initialSorter={appliedSorter}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBar: {
        marginBottom: 16,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'center',
    },
    filterButton: {
        marginRight: 8,
    },
    filterChip: {
        marginRight: 8,
    },
    movieList: {
        paddingBottom: 16,
    },
    loader: {
        flex: 1,
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default ExploreScreen;
