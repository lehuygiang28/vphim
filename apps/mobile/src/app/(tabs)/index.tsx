import React from 'react';
import { View, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';
import { useList } from '@refinedev/core';
import { useTheme, Text, Card, Button, Spinner, Layout } from '@ui-kitten/components';
import { useRouter } from 'expo-router';
import Swiper from 'react-native-swiper';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Eye } from 'lucide-react-native';

import { MOVIES_LIST_QUERY, MOVIES_LIST_FOR_SWIPER_QUERY } from '@/queries/movies';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';

import { MovieCard } from '~mb/components/card/movie-card';

const { width } = Dimensions.get('window');

const MovieSection = ({
    title,
    movies,
    onMoviePress,
}: {
    title: string;
    movies: MovieResponseDto[];
    onMoviePress: (movie: MovieResponseDto) => void;
}) => {
    const theme = useTheme();

    return (
        <View style={styles.section}>
            <Text
                category="h5"
                style={[styles.sectionTitle, { color: theme['color-primary-500'] }]}
            >
                {title}
            </Text>
            <FlatList
                data={movies}
                renderItem={({ item }) => (
                    <MovieCard movie={item} onPress={() => onMoviePress(item)} />
                )}
                keyExtractor={(item) => item._id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
};

const MovieSwiper = ({ movies }: { movies: MovieResponseDto[] }) => {
    const router = useRouter();

    if (!movies || movies.length === 0) {
        return null;
    }

    return (
        <View style={styles.swiperContainer}>
            <Swiper autoplay autoplayTimeout={5} showsPagination={false} loop style={styles.swiper}>
                {movies.map((movie) => (
                    <Card
                        key={movie._id.toString()}
                        onPress={() => router.push(`/movie/${movie.slug}`)}
                        style={styles.swiperSlide}
                    >
                        <Image
                            source={{
                                uri: getOptimizedImageUrl(movie.posterUrl || movie.thumbUrl, {
                                    baseUrl: process.env.EXPO_PUBLIC_BASE_API_URL,
                                    width: 1200,
                                    height: 720,
                                }),
                            }}
                            style={styles.swiperImage}
                            contentFit="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.swiperContent}>
                            <Text category="h4" style={styles.swiperTitle}>
                                {movie.name}
                            </Text>
                            <Text category="s1" style={styles.swiperSubtitle}>
                                {movie.originName}
                            </Text>
                            <View style={styles.swiperMetadata}>
                                <Button size="tiny" status="primary" accessoryLeft={<Calendar />}>
                                    {movie.year || 'N/A'}
                                </Button>
                                <Button size="tiny" status="primary" accessoryLeft={<Eye />}>
                                    {movie.view?.toLocaleString() || '0'}
                                </Button>
                            </View>
                        </View>
                    </Card>
                ))}
            </Swiper>
        </View>
    );
};

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();

    const { data: mostViewed, isLoading: mostViewedLoading } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_FOR_SWIPER_QUERY, operation: 'movies' },
        resource: 'movies',
        sorters: [{ field: 'view', order: 'desc' }],
    });

    const { data: newMovies } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        resource: 'movies',
        filters: [{ field: 'years', value: `${new Date().getFullYear()}`, operator: 'eq' }],
        sorters: [{ field: 'year', order: 'asc' }],
    });

    const { data: actionMovies } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        resource: 'movies',
        filters: [{ field: 'categories', value: 'hanh-dong', operator: 'eq' }],
        sorters: [{ field: 'year', order: 'desc' }],
    });

    const onMoviePress = (movie: MovieResponseDto) => {
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
        <ScrollView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
            contentContainerStyle={styles.contentContainer}
        >
            {mostViewed?.data && mostViewed.data.length > 0 && (
                <MovieSwiper movies={mostViewed.data.slice(0, 5)} />
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
