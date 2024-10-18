import React from 'react';
import { StyleSheet, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useList } from '@refinedev/core';
import { useTheme, Spinner, Layout } from '@ui-kitten/components';

import { MOVIES_LIST_QUERY, MOVIES_LIST_FOR_SWIPER_QUERY } from '~fe/queries/movies';
import { type MovieType } from '~api/app/movies/movie.type';

import ImmersiveMovieSwiper from '~mb/components/swiper/movie-swiper';
import { MovieSection } from '~mb/components/list/movie-section';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();

    const { data: mostViewed, isLoading: mostViewedLoading } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_FOR_SWIPER_QUERY, operation: 'movies' },
        resource: 'movies',
        sorters: [{ field: 'view', order: 'desc' }],
    });

    const { data: newMovies } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        resource: 'movies',
        filters: [{ field: 'years', value: `${new Date().getFullYear()}`, operator: 'eq' }],
        sorters: [{ field: 'year', order: 'asc' }],
    });

    const { data: actionMovies } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        resource: 'movies',
        filters: [{ field: 'categories', value: 'hanh-dong', operator: 'eq' }],
        sorters: [{ field: 'year', order: 'desc' }],
    });

    const onMoviePress = (movie: MovieType) => {
        router.push(`/movie/${movie.slug}`);
    };

    if (mostViewedLoading) {
        return (
            <Layout
                style={[
                    styles.loadingContainer,
                    { backgroundColor: theme['background-basic-color-1'] },
                ]}
            >
                <Spinner size="large" />
            </Layout>
        );
    }

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <ScrollView
                style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
                contentContainerStyle={styles.contentContainer}
            >
                {mostViewed?.data && mostViewed.data.length > 0 && (
                    <ImmersiveMovieSwiper movies={mostViewed.data} />
                )}
                {newMovies?.data && newMovies.data.length > 0 && (
                    <MovieSection
                        title="Phim Mới"
                        movies={newMovies.data}
                        onMoviePress={onMoviePress}
                    />
                )}
                {actionMovies?.data && actionMovies.data.length > 0 && (
                    <MovieSection
                        title="Phim Hành Động"
                        movies={actionMovies.data}
                        onMoviePress={onMoviePress}
                    />
                )}
            </ScrollView>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
