import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Card, Text, useTheme } from '@ui-kitten/components';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { type MovieType } from '~api/app/movies/movie.type';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;
const CARD_HEIGHT = CARD_WIDTH * 1.5; // Maintaining a 2:3 aspect ratio

export const MovieCard = ({ movie, onPress }: { movie: MovieType; onPress: () => void }) => {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <Card style={styles.card} onPress={onPress}>
                <Image
                    source={{
                        uri: getOptimizedImageUrl(movie?.thumbUrl || movie?.posterUrl, {
                            baseUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
                            width: 480,
                            height: 854,
                            quality: 60,
                        }),
                    }}
                    style={styles.poster}
                    contentFit="cover"
                    transition={1000}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                />
            </Card>
            <Text
                category="s1"
                numberOfLines={2}
                style={[styles.title, { color: theme['text-basic-color'] }]}
            >
                {movie.name}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        marginHorizontal: 8,
        marginBottom: 16,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 12,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
    },
    poster: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        position: 'absolute',
    },
    title: {
        marginTop: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '50%',
    },
});
