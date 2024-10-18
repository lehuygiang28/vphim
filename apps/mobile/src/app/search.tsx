import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Layout, Input, Text, ListItem, useTheme } from '@ui-kitten/components';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, ArrowLeft } from 'lucide-react-native';
import { useInfiniteList } from '@refinedev/core';
import { useDebounce } from 'use-debounce';
import { capitalize } from 'lodash';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { MovieType } from '~api/app/movies/movie.type';

import { MOVIES_LIST_QUERY } from '~fe/queries/movies';
import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';

const SkeletonLoader = () => {
    const theme = useTheme();

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.skeletonContainer}>
            {[...Array(5)].map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.skeletonItem,
                        { borderBottomColor: theme['border-basic-color-3'] },
                    ]}
                >
                    <View
                        style={[
                            styles.skeletonImage,
                            { backgroundColor: theme['background-basic-color-3'] },
                        ]}
                    />
                    <View style={styles.skeletonContent}>
                        <View
                            style={[
                                styles.skeletonTitle,
                                { backgroundColor: theme['background-basic-color-3'] },
                            ]}
                        />
                        <View
                            style={[
                                styles.skeletonDescription,
                                { backgroundColor: theme['background-basic-color-3'] },
                            ]}
                        />
                    </View>
                </View>
            ))}
        </Animated.View>
    );
};

export default function SearchScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { searchQuery: initialSearchQuery } = useLocalSearchParams();
    const [inputValue, setInputValue] = useState((initialSearchQuery as string) || '');
    const [debouncedSearchQuery] = useDebounce(inputValue, 300);
    const flatListRef = useRef<Animated.FlatList<MovieType>>(null);
    const [isSearching, setIsSearching] = useState(false);

    const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useInfiniteList<MovieType>({
            resource: 'movies',
            dataProviderName: 'graphql',
            meta: {
                gqlQuery: MOVIES_LIST_QUERY,
            },
            pagination: {
                pageSize: 10,
            },
            filters: [{ field: 'keywords', operator: 'contains', value: debouncedSearchQuery }],
            sorters: [],
            errorNotification: false,
            successNotification: false,
        });

    useEffect(() => {
        setIsSearching(true);
        const timer = setTimeout(() => setIsSearching(false), 500);
        return () => clearTimeout(timer);
    }, [debouncedSearchQuery]);

    const handleInputChange = useCallback(
        (text: string) => {
            setInputValue(text);
            flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        },
        [flatListRef],
    );

    const renderMovieItem = useCallback(
        ({ item }: { item: MovieType }) => (
            <Animated.View entering={FadeIn} layout={LinearTransition}>
                <ListItem
                    title={(evaProps) => (
                        <Text
                            {...evaProps}
                            style={[evaProps?.style, { color: theme['text-basic-color'] }]}
                        >
                            {item.name}
                        </Text>
                    )}
                    description={(evaProps) => (
                        <Text
                            {...evaProps}
                            style={[evaProps?.style, { color: theme['text-hint-color'] }]}
                        >
                            {`${item.originName ? `${item.originName} • ` : ''}${
                                item.year || 'N/A'
                            } • ${item.quality?.toUpperCase()} • ${
                                capitalize(item.lang) || 'Đang cập nhật...'
                            }`}
                        </Text>
                    )}
                    onPress={() => router.push(`/movie/${item.slug}`)}
                    accessoryLeft={() => (
                        <Image
                            source={{
                                uri: getOptimizedImageUrl(item?.thumbUrl || item?.posterUrl, {
                                    baseUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
                                    width: 480,
                                    height: 854,
                                    quality: 60,
                                }),
                            }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                        />
                    )}
                />
            </Animated.View>
        ),
        [router, theme],
    );

    const keyExtractor = useCallback((item: MovieType) => item._id.toString(), []);

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerLoader}>
                <Text style={{ color: theme['text-hint-color'] }}>Loading more...</Text>
            </View>
        );
    };

    const allMovies = data?.pages.flatMap((page) => page.data) || [];

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <Layout
                style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
            >
                <Animated.View style={styles.searchContainer} layout={LinearTransition}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft color={theme['text-basic-color']} size={24} />
                    </TouchableOpacity>
                    <Input
                        placeholder="Search movies"
                        value={inputValue}
                        onChangeText={handleInputChange}
                        style={styles.searchInput}
                        accessoryRight={(props) => (
                            <Search {...props} color={theme['text-basic-color']} size={20} />
                        )}
                    />
                </Animated.View>
                {isError ? (
                    <Text style={[styles.errorText, { color: theme['color-danger-500'] }]}>
                        An error occurred while fetching movies.
                    </Text>
                ) : isLoading || isSearching ? (
                    <SkeletonLoader />
                ) : (
                    <Animated.FlatList
                        ref={flatListRef}
                        data={allMovies}
                        renderItem={renderMovieItem}
                        keyExtractor={keyExtractor}
                        style={styles.resultsList}
                        ListEmptyComponent={
                            <Animated.Text
                                entering={FadeIn}
                                style={[styles.emptyText, { color: theme['text-hint-color'] }]}
                            >
                                No results found
                            </Animated.Text>
                        }
                        onEndReached={() => {
                            if (hasNextPage) {
                                fetchNextPage();
                            }
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                    />
                )}
            </Layout>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backButton: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
    },
    resultsList: {
        flex: 1,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 20,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
    },
    footerLoader: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    thumbnail: {
        width: 50,
        height: 75,
        borderRadius: 4,
        marginRight: 10,
    },
    skeletonContainer: {
        flex: 1,
    },
    skeletonItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
    },
    skeletonImage: {
        width: 50,
        height: 75,
        borderRadius: 4,
    },
    skeletonContent: {
        flex: 1,
        marginLeft: 10,
    },
    skeletonTitle: {
        height: 20,
        width: '80%',
        marginBottom: 8,
    },
    skeletonDescription: {
        height: 16,
        width: '60%',
    },
});
