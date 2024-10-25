import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    StyleSheet,
    ScrollView,
    Dimensions,
    SafeAreaView,
    RefreshControl,
    View,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useList } from '@refinedev/core';
import { useTheme, Spinner } from '@ui-kitten/components';

import { MOVIES_LIST_QUERY, MOVIES_LIST_FOR_SWIPER_QUERY } from '~fe/queries/movies';
import { type MovieType } from '~api/app/movies/movie.type';

import ImmersiveMovieSwiper from '~mb/components/swiper/movie-swiper';
import { MovieSection } from '~mb/components/list/movie-section';
import { ShimmerPlaceholder } from '~mb/components/animation/shimmer-placeholder';
import { FadeInView } from '~mb/components/animation/fade-in';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [isLoading, setIsLoading] = useState(false);

    const {
        data: mostViewed,
        isLoading: mostViewedLoading,
        refetch: refetchMostViewed,
    } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_FOR_SWIPER_QUERY, operation: 'movies' },
        resource: 'movies',
        sorters: [{ field: 'view', order: 'desc' }],
    });

    const { data: newMovies, refetch: refetchNewMovies } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        resource: 'movies',
        filters: [{ field: 'years', value: `${new Date().getFullYear()}`, operator: 'eq' }],
        sorters: [{ field: 'year', order: 'asc' }],
    });

    const { data: actionMovies, refetch: refetchActionMovies } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        resource: 'movies',
        filters: [{ field: 'categories', value: 'hanh-dong', operator: 'eq' }],
        sorters: [{ field: 'year', order: 'desc' }],
    });

    const onMoviePress = (movie: MovieType) => {
        router.push(`/movie/${movie.slug}`);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setIsLoading(true);
        try {
            await Promise.allSettled([
                refetchMostViewed(),
                refetchNewMovies(),
                refetchActionMovies(),
            ]);
        } finally {
            setRefreshing(false);
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0.5,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setIsLoading(false);
                });
            });
        }
    }, [refetchMostViewed, refetchNewMovies, refetchActionMovies, fadeAnim]);

    useEffect(() => {
        if (!mostViewedLoading) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }
    }, [fadeAnim, mostViewedLoading]);

    const renderContent = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            {mostViewed?.data && mostViewed.data.length > 0 ? (
                <FadeInView delay={200}>
                    <ImmersiveMovieSwiper movies={mostViewed.data} />
                </FadeInView>
            ) : (
                <ShimmerPlaceholder width={width} height={300} />
            )}
            {newMovies?.data && newMovies.data.length > 0 && (
                <FadeInView delay={400}>
                    <MovieSection
                        title="Phim Mới"
                        movies={newMovies.data}
                        onMoviePress={onMoviePress}
                    />
                </FadeInView>
            )}
            {actionMovies?.data && actionMovies.data.length > 0 && (
                <FadeInView delay={600}>
                    <MovieSection
                        title="Phim Hành Động"
                        movies={actionMovies.data}
                        onMoviePress={onMoviePress}
                    />
                </FadeInView>
            )}
        </Animated.View>
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme['color-primary-500']]}
                        tintColor={theme['color-primary-500']}
                        progressViewOffset={20}
                    />
                }
            >
                {renderContent()}
            </ScrollView>
            {isLoading && (
                <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                    <Spinner size="large" status="primary" />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    loadingOverlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shimmerSpace: {
        height: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        marginLeft: 16,
        marginBottom: 12,
    },
    swiperContainer: {
        height: 300,
        marginBottom: 20,
    },
    swiper: {
        height: 300,
    },
    swiperSlide: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    swiperImage: {
        width: width,
        height: 300,
    },
    swiperContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    swiperTitle: {
        color: 'white',
        fontWeight: 'bold',
    },
    swiperSubtitle: {
        color: 'white',
        marginBottom: 8,
    },
    swiperMetadata: {
        flexDirection: 'row',
        gap: 8,
    },
});
