import React, { useState, useCallback, useRef } from 'react';
import {
    FlatList,
    View,
    StyleSheet,
    RefreshControl,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Text, useTheme, Spinner } from '@ui-kitten/components';
import { useInfiniteList, CrudSort, LogicalFilter } from '@refinedev/core';

import { MOVIES_LIST_QUERY } from '~fe/queries/movies';
import { MovieCard } from '~mb/components/card/movie-card';
import { useRefreshControl } from '~mb/hooks/use-refresh-control';

import type { MovieType } from '~api/app/movies/movie.type';
import { MovieFilters } from './explore-filter';

const ExploreScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const [query, setQuery] = useState({
        filters: [] as LogicalFilter[],
        sorters: [{ field: 'view', order: 'desc' }] as CrudSort[],
        pagination: { current: 1, pageSize: 20 },
    });
    const [isSearching, setIsSearching] = useState(false);
    const [isAtTop, setIsAtTop] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
        useInfiniteList<MovieType>({
            resource: 'movies',
            dataProviderName: 'graphql',
            meta: {
                gqlQuery: MOVIES_LIST_QUERY,
            },
            errorNotification: false,
            successNotification: false,
            ...query,
        });

    const { refreshControlProps } = useRefreshControl({
        onRefresh: refetch,
    });

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsAtTop(offsetY <= 0);
    }, []);

    const scrollToTop = useCallback(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (!isAtTop) {
                scrollToTop();
            } else {
                refetch();
            }
        }, [isAtTop, scrollToTop, refetch]),
    );

    const applySearch = useCallback(
        (
            newQuery: React.SetStateAction<{
                filters: LogicalFilter[];
                sorters: CrudSort[];
                pagination: { current: number; pageSize: number };
            }>,
        ) => {
            setIsSearching(true);
            setQuery(newQuery);
            refetch().finally(() => setIsSearching(false));
        },
        [refetch],
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
            <MovieFilters
                query={query}
                setQuery={setQuery}
                applySearch={applySearch}
                isSearching={isSearching}
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
                    refreshControl={
                        <RefreshControl
                            {...refreshControlProps}
                            refreshing={refreshControlProps.refreshing}
                            onRefresh={() => {
                                refreshControlProps.onRefresh();
                                scrollToTop();
                            }}
                        />
                    }
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    movieList: {
        paddingHorizontal: 8,
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
