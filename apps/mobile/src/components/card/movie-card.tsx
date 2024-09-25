import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme, Card, Title, Paragraph, TouchableRipple } from 'react-native-paper';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { type MovieType } from '~api/app/movies/movie.type';

const AnimatedCard = Animated.createAnimatedComponent(Card);

const { width } = Dimensions.get('window');

export const MovieCard = ({ movie, onPress }: { movie: MovieType; onPress: () => void }) => {
    const theme = useTheme();

    return (
        <AnimatedCard
            style={[styles.movieCard, { backgroundColor: theme.colors.elevation.level2 }]}
            entering={FadeInRight}
            exiting={FadeOutLeft}
        >
            <TouchableRipple onPress={onPress}>
                <View>
                    <Image
                        source={{
                            uri: getOptimizedImageUrl(movie.thumbUrl || movie.posterUrl, {
                                baseUrl: process.env.EXPO_PUBLIC_BASE_API_URL,
                                width: 750,
                                height: 1000,
                            }),
                        }}
                        style={styles.moviePoster}
                        contentFit="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.movieCardContent}>
                        <Title numberOfLines={1} style={{ color: theme.colors.onSurface }}>
                            {movie.name}
                        </Title>
                        <Paragraph style={{ color: theme.colors.primary }}>{movie.year}</Paragraph>
                    </View>
                </View>
            </TouchableRipple>
        </AnimatedCard>
    );
};

const styles = StyleSheet.create({
    movieCard: {
        width: width * 0.4,
        marginHorizontal: 8,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    moviePoster: {
        width: '100%',
        aspectRatio: 2 / 3,
    },
    movieCardContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 8,
    },
});
