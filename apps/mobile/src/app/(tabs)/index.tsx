import React from 'react';
import { StyleSheet, FlatList, Dimensions, SafeAreaView, View, Animated } from 'react-native';
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

interface SectionItem {
    id: string;
    type: 'swiper' | 'movieSection';
    title?: string;
    movies?: MovieType[];
}

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

    const getSections = (): SectionItem[] => {
        const sections: SectionItem[] = [];

        // Add swiper section
        sections.push({
            id: 'swiper',
            type: 'swiper',
        });

        // Add new movies section if available
        if (newMovies?.data && newMovies.data.length > 0) {
            sections.push({
                id: 'new-movies',
                type: 'movieSection',
                title: 'Phim Mới',
                movies: newMovies.data,
            });
        }

        // Add action movies section if available
        if (actionMovies?.data && actionMovies.data.length > 0) {
            sections.push({
                id: 'action-movies',
                type: 'movieSection',
                title: 'Phim Hành Động',
                movies: actionMovies.data,
            });
        }

        return sections;
    };

    const renderItem = ({ item }: { item: SectionItem }) => {
        if (item.type === 'swiper') {
            return (
                <Animated.View style={{ opacity: fadeAnim }}>
                    {mostViewed?.data && mostViewed.data.length > 0 ? (
                        <FadeInView delay={200}>
                            <ImmersiveMovieSwiper movies={mostViewed.data} />
                        </FadeInView>
                    ) : (
                        <ShimmerPlaceholder width={width} height={300} />
                    )}
                </Animated.View>
            );
        } else if (item.type === 'movieSection' && item.movies) {
            return (
                <Animated.View style={{ opacity: fadeAnim }}>
                    <FadeInView delay={400}>
                        <MovieSection
                            title={item.title || ''}
                            movies={item.movies}
                            onMoviePress={onMoviePress}
                        />
                    </FadeInView>
                </Animated.View>
            );
        }
        return null;
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <FlatList
                data={getSections()}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
                contentContainerStyle={styles.contentContainer}
                refreshControl={RefreshControl}
            />
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
