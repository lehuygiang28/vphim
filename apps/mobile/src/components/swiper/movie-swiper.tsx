import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon, Calendar, Eye, Clock } from 'lucide-react-native';
import { Layout, Text, useTheme } from '@ui-kitten/components';
import SwiperFlatList from 'react-native-swiper-flatlist';

import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { MovieType } from '~api/app/movies/movie.type';
import MovieRatings from '../card/movie-ratings';

const { width, height } = Dimensions.get('window');

function MovieSwiper({ movies = [] }: { movies?: MovieType[] }) {
    const router = useRouter();
    const theme = useTheme();

    const renderItem = useCallback(
        ({ item: movie }: { item: MovieType }) => (
            <TouchableOpacity
                style={styles.movieCard}
                onPress={() => router.push(`/movie/${movie.slug}`)}
                activeOpacity={0.9}
            >
                <Image
                    source={{
                        uri: getOptimizedImageUrl(movie.posterUrl || movie.thumbUrl, {
                            baseUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
                            width: 1200,
                            height: 720,
                        }),
                    }}
                    style={styles.backgroundImage}
                    contentFit="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.movieInfo}>
                    <Text category="h4" style={styles.title}>
                        {movie.name}
                    </Text>
                    <Text category="s1" style={styles.subtitle}>
                        {movie.originName}
                    </Text>
                    <View style={styles.metadataContainer}>
                        <MetadataItem icon={Calendar} text={movie?.year?.toString() || 'N/A'} />
                        <MetadataItem icon={Eye} text={movie.view?.toLocaleString() || '0'} />
                        {movie.time && <MetadataItem icon={Clock} text={movie.time} />}
                        <MovieRatings
                            imdbId={movie.imdb?.id}
                            tmdbId={movie?.tmdb?.id}
                            tmdbType={movie?.tmdb?.type}
                            size="small"
                        />
                    </View>
                    <Text category="p2" style={styles.description} numberOfLines={2}>
                        {movie.content}
                    </Text>
                </View>
            </TouchableOpacity>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [movies],
    );

    const MetadataItem = ({
        icon: Icon,
        text,
        iconColor = 'white',
    }: {
        icon?: LucideIcon;
        text: string;
        iconColor?: string;
    }) => (
        <View style={styles.metadataItem}>
            {Icon && <Icon size={16} color={iconColor} />}
            <Text category="c1" style={styles.metadataText}>
                {text}
            </Text>
        </View>
    );

    if (!movies || movies.length === 0) {
        return null;
    }

    return (
        <Layout style={styles.container} level="1">
            <SwiperFlatList
                data={movies}
                renderItem={renderItem}
                showPagination
                paginationActiveColor={theme['color-primary-400']}
                paginationDefaultColor={theme['color-basic-400']}
                paginationStyleItem={styles.paginationDot}
                autoplay
                autoplayDelay={5}
                autoplayLoop
            />
        </Layout>
    );
}

export default memo(MovieSwiper);

export const styles = StyleSheet.create({
    container: {
        height: height * 0.4,
        marginBottom: 20,
    },
    movieCard: {
        width,
        height: '100%',
        justifyContent: 'flex-end',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
    },
    movieInfo: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        color: 'white',
        marginBottom: 12,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    metadataContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 8,
    },
    metadataText: {
        color: 'white',
        marginLeft: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    description: {
        color: 'white',
        opacity: 0.9,
        marginBottom: 16,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    watchButton: {
        alignSelf: 'flex-start',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});
