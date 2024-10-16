import React, { useState, useCallback, useRef } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Input, Text, useTheme, Spinner } from '@ui-kitten/components';
import { useInfiniteList, CrudFilters, CrudSort, LogicalFilter } from '@refinedev/core';
import { Search } from 'lucide-react-native';
import { useDebouncedCallback } from 'use-debounce';

import { MOVIES_LIST_QUERY } from '~fe/queries/movies';
import { MovieType } from '~api/app/movies/movie.type';

import { MovieCard } from '~mb/components/card/movie-card';

const ExploreScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const { searchQuery: initialSearchQuery } = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState((initialSearchQuery as string) || '');
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
            sorters: appliedSorter ? [appliedSorter] : [],
            errorNotification: false,
            successNotification: false,
        });

    const debouncedSearch = useDebouncedCallback((query: string) => {
        setIsSearching(true);
        const newFilters: CrudFilters = [
            { field: 'keywords', operator: 'contains', value: query },
            ...appliedFilters.filter((filter) => (filter as LogicalFilter).field !== 'keywords'),
        ];
        setAppliedFilters(newFilters);
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        setIsSearching(false);
    }, 500);

    const handleSearch = useCallback(
        (query: string) => {
            setSearchQuery(query);
            debouncedSearch(query);
        },
        [debouncedSearch],
    );

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
                <Spinner size="medium" />
            </View>
        );
    };

    if (isError) {
        return (
            <View style={styles.centerContainer}>
                <Text category="h6">An error occurred while fetching movies.</Text>
            </View>
        );
    }

    const allMovies = data?.pages.flatMap((page) => page.data) || [];

    return (
        <View style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}>
            <Input
                placeholder="Search movies"
                value={searchQuery}
                onChangeText={handleSearch}
                accessoryLeft={(props) => (
                    <Search {...props} size={20} color={theme['text-basic-color']} />
                )}
                style={styles.searchBar}
            />
            {isLoading || isSearching ? (
                <View style={styles.loader}>
                    <Spinner size="large" />
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 16,
    },
    movieList: {
        paddingBottom: 16,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default ExploreScreen;
