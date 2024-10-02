import React from 'react';
import { View, StyleSheet, FlatList, ScrollView, Dimensions } from 'react-native';
import { useList } from '@refinedev/core';
import {
    useTheme,
    Text,
    Title,
    ActivityIndicator,
    TouchableRipple,
    Chip,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import Swiper from 'react-native-swiper';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarIcon, EyeIcon } from 'lucide-react-native';

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
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{title}</Text>
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
    const theme = useTheme();
    const router = useRouter();

    if (!movies || movies.length === 0) {
        return null;
    }

    return (
        <View style={styles.swiperContainer}>
            <Swiper autoplay autoplayTimeout={5} showsPagination={false} loop style={styles.swiper}>
                {movies.map((movie) => (
                    <TouchableRipple
                        key={movie._id.toString()}
                        onPress={() => router.push(`/movie/${movie.slug}`)}
                        style={styles.swiperSlide}
                    >
                        <View>
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
                                <Title style={styles.swiperTitle}>{movie.name}</Title>
                                <Text style={styles.swiperSubtitle}>{movie.originName}</Text>
                                <View style={styles.swiperMetadata}>
                                    <Chip
                                        icon={() => (
                                            <CalendarIcon
                                                size={16}
                                                color={theme.colors.onPrimary}
                                            />
                                        )}
                                        style={{ backgroundColor: theme.colors.primary }}
                                        textStyle={{ color: theme.colors.onPrimary }}
                                    >
                                        {movie.year || 'N/A'}
                                    </Chip>
                                    <Chip
                                        icon={() => (
                                            <EyeIcon size={16} color={theme.colors.onPrimary} />
                                        )}
                                        style={{ backgroundColor: theme.colors.primary }}
                                        textStyle={{ color: theme.colors.onPrimary }}
                                    >
                                        {movie.view?.toLocaleString() || '0'}
                                    </Chip>
                                </View>
                            </View>
                        </View>
                    </TouchableRipple>
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
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
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
        fontSize: 22,
        fontWeight: 'bold',
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
        fontSize: 24,
        fontWeight: 'bold',
    },
    swiperSubtitle: {
        color: 'white',
        fontSize: 16,
        marginBottom: 8,
    },
    swiperMetadata: {
        flexDirection: 'row',
        gap: 8,
    },
});
