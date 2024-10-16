import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Text, Tooltip } from '@ui-kitten/components';

import { getOptimizedImageUrl } from '@/libs/utils/movie.util';

interface MovieRatingsProps {
    imdbId?: string;
    tmdbId?: string;
    tmdbType?: string | null;
    size?: 'small' | 'medium' | 'large';
}

interface RatingData {
    rating: string;
    votes: string;
}

const MovieRatings: React.FC<MovieRatingsProps> = ({
    imdbId,
    tmdbId,
    tmdbType,
    size = 'medium',
}) => {
    const [imdbData, setImdbData] = useState<RatingData | null>(null);
    const [tmdbData, setTmdbData] = useState<RatingData | null>(null);

    useEffect(() => {
        const fetchImdbData = async () => {
            if (!imdbId) return;
            try {
                const response = await fetch(
                    `https://data.ratings.media-imdb.com/${imdbId}/data.json`,
                );
                if (!response.ok) throw new Error('Failed to fetch IMDB data');
                const data = await response.json();
                setImdbData({ rating: data.imdbRating[0], votes: data.imdbRating[1] });
            } catch (error) {
                console.error('Error fetching IMDB data:', error);
                setImdbData({ rating: 'N/A', votes: 'N/A' });
            }
        };

        const fetchTmdbData = async () => {
            if (!tmdbId || !tmdbType) return;
            try {
                const response = await fetch(
                    `https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?language=en-US&api_key=${process.env.EXPO_PUBLIC_TMDB_API_KEY}`,
                );
                if (!response.ok) throw new Error('Failed to fetch TMDB data');
                const data = await response.json();
                setTmdbData({
                    rating: data.vote_average.toFixed(1),
                    votes: data.vote_count.toString(),
                });
            } catch (error) {
                console.error('Error fetching TMDB data:', error);
                setTmdbData({ rating: 'N/A', votes: 'N/A' });
            }
        };

        fetchImdbData();
        fetchTmdbData();
    }, [imdbId, tmdbId, tmdbType]);

    const sizeStyles = {
        small: { height: 24, fontSize: 12, iconSize: 12 },
        medium: { height: 32, fontSize: 14, iconSize: 16 },
        large: { height: 40, fontSize: 16, iconSize: 20 },
    };

    const { height, fontSize } = sizeStyles[size];

    const RatingTag: React.FC<{
        color: string;
        logo: string;
        rating: string;
        votes: string;
        url: string;
    }> = ({ color, logo, rating, votes, url }) => (
        <TouchableOpacity
            style={[styles.ratingTag, { backgroundColor: color, height }]}
            onPress={() => Linking.openURL(url)}
        >
            <View style={styles.logoContainer}>
                <Image
                    source={logo}
                    style={[styles.logo, { height: height * 0.6 }]}
                    contentFit="contain"
                />
            </View>
            <Tooltip
                anchor={() => (
                    <View style={styles.ratingContainer}>
                        <Text style={[styles.rating, { fontSize }]}>{rating}</Text>
                    </View>
                )}
            >
                {`${votes} votes`}
            </Tooltip>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {imdbData && imdbId && (
                <RatingTag
                    color="#f5c518"
                    logo={getOptimizedImageUrl('https://vephim.online/assets/imdb_46x22.png', {
                        baseUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
                        height: 120,
                        width: 120,
                        quality: 100,
                    })}
                    rating={imdbData.rating}
                    votes={imdbData.votes}
                    url={`https://www.imdb.com/title/${imdbId}/`}
                />
            )}
            {tmdbData && tmdbId && tmdbType && (
                <RatingTag
                    color="#01b4e4"
                    logo={getOptimizedImageUrl('https://vephim.online/assets/tmdb.svg', {
                        baseUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
                        height: 120,
                        width: 120,
                        quality: 100,
                    })}
                    rating={tmdbData.rating}
                    votes={tmdbData.votes}
                    url={`https://www.themoviedb.org/${tmdbType}/${tmdbId}`}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 8,
    },
    ratingTag: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 4,
        overflow: 'hidden',
    },
    logoContainer: {
        backgroundColor: '#000000',
        padding: 4,
        height: '100%',
        justifyContent: 'center',
    },
    logo: {
        width: 'auto',
        aspectRatio: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    rating: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginRight: 4,
    },
});

export default MovieRatings;
