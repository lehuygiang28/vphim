import React from 'react';
import { StyleSheet, ScrollView, Dimensions, SafeAreaView, View, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useList } from '@refinedev/core';
import { useTheme, Spinner } from '@ui-kitten/components';

import { MOVIES_LIST_QUERY, MOVIES_LIST_FOR_SWIPER_QUERY } from '~fe/queries/movies';
import { type MovieType } from '~api/app/movies/movie.type';
import ImmersiveMovieSwiper from '~mb/components/swiper/movie-swiper';
import { MovieSection } from '~mb/components/list/movie-section';
import { ShimmerPlaceholder } from '~mb/components/animation/shimmer-placeholder';
import { FadeInView } from '~mb/components/animation/fade-in';
import { useRefreshControl } from '~mb/hooks/use-refresh-control';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();

    const { data: mostViewed, refetch: refetchMostViewed } = useList<MovieType>({
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

    const { isLoading, fadeAnim, overlayStyle, RefreshControl } = useRefreshControl({
        onRefresh: async () => {
            await Promise.allSettled([
                refetchMostViewed(),
                refetchNewMovies(),
                refetchActionMovies(),
            ]);
        },
    });

    const onMoviePress = (movie: MovieType) => {
        router.push(`/movie/${movie.slug}`);
    };

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
                refreshControl={RefreshControl}
            >
                {renderContent()}
            </ScrollView>
            {isLoading && (
                <View style={overlayStyle}>
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
});
