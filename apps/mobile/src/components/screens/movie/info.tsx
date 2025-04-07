import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, Divider } from '@ui-kitten/components';
import { Calendar, Clock, Star } from 'lucide-react-native';

import { MovieType } from '~api/app/movies/movie.type';

import { removeStyleProperty } from '~mb/libs/utils';
import MovieRatings from '~mb/components/card/movie-ratings';
import MovieContent from '~mb/components/text/movie-content';

interface MovieInfoProps {
    movie: MovieType;
}

export default function MovieInfo({ movie }: MovieInfoProps) {
    return (
        <Card style={styles.infoCard} status="basic">
            <Text category="h5" style={styles.title}>
                {movie.name}
            </Text>
            <Text category="s1" appearance="hint" style={styles.originalTitle}>
                {movie.originName}
            </Text>
            <View style={styles.metaInfo}>
                <Button
                    appearance="ghost"
                    status="basic"
                    accessoryLeft={(props) => <Calendar {...removeStyleProperty(props)} />}
                    size="small"
                >
                    {movie.year || 'N/A'}
                </Button>
                <Button
                    appearance="ghost"
                    status="basic"
                    accessoryLeft={(props) => <Clock {...removeStyleProperty(props)} />}
                    size="small"
                >
                    {movie.time || 'N/A'}
                </Button>
                {movie.tmdb?.voteAverage && (
                    <Button
                        appearance="ghost"
                        status="warning"
                        accessoryLeft={(props) => <Star {...removeStyleProperty(props)} />}
                        size="small"
                    >
                        {movie.tmdb.voteAverage.toFixed(1)}
                    </Button>
                )}
            </View>
            <Divider style={styles.divider} />
            {(movie.imdb?.id || movie.tmdb?.id) && (
                <>
                    <Text category="s1" style={styles.categoriesTitle}>
                        Đánh giá:
                    </Text>
                    <MovieRatings
                        imdbId={movie.imdb?.id}
                        tmdbId={movie.tmdb?.id}
                        tmdbType={movie.tmdb?.type}
                        size="small"
                    />
                    <Divider style={styles.divider} />
                </>
            )}
            <MovieContent content={movie.content} maxLines={5} />
            <Divider style={styles.divider} />
            {movie.categories && movie.categories.length > 0 && (
                <View style={styles.categoriesContainer}>
                    <Text category="s1" style={styles.categoriesTitle}>
                        Thể loại:
                    </Text>
                    <View style={styles.categoriesList}>
                        {movie.categories.map((category) => (
                            <Button
                                key={category.slug}
                                size="tiny"
                                appearance="outline"
                                status="basic"
                                style={styles.categoryButton}
                            >
                                {category.name}
                            </Button>
                        ))}
                    </View>
                </View>
            )}
        </Card>
    );
}

const styles = StyleSheet.create({
    infoCard: {
        margin: 16,
        backgroundColor: 'transparent',
    },
    title: {
        marginBottom: 4,
    },
    originalTitle: {
        marginBottom: 12,
    },
    metaInfo: {
        flexDirection: 'row',
    },
    divider: {
        marginVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    categoriesContainer: {
        marginTop: 16,
    },
    categoriesTitle: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    categoriesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryButton: {
        marginRight: 8,
        marginBottom: 8,
    },
});
