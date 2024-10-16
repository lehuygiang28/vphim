import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { useOne } from '@refinedev/core';
import {
    Layout,
    Text,
    Card,
    Button,
    Spinner,
    TopNavigation,
    TopNavigationAction,
    Divider,
    useTheme,
} from '@ui-kitten/components';
import { Image } from 'expo-image';
import { ArrowLeft, Calendar, Clock, PlayCircle, Star } from 'lucide-react-native';
import WebView from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { EpisodeServerDataType, MovieType } from '~api/app/movies/movie.type';
import { GET_MOVIE_QUERY } from '@/queries/movies';
import { truncateText } from '@/libs/utils/movie.util';

const { width, height } = Dimensions.get('window');

export default function MovieScreen() {
    const theme = useTheme();
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const navigation = useNavigation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);

    const { data: movie, isLoading } = useOne<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: {
            gqlQuery: GET_MOVIE_QUERY,
            operation: 'movie',
            variables: {
                input: {
                    slug: slug,
                },
            },
        },
        id: Array.isArray(slug) ? slug[0] : slug,
    });

    useEffect(() => {
        if (movie?.data?.episode && movie.data.episode.length > 0) {
            setSelectedEpisode(movie.data.episode[0].serverData[0]);
        }
    }, [movie]);

    const handlePlayPress = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const renderBackAction = () => (
        <TopNavigationAction
            icon={(props) => <ArrowLeft {...props} color={theme['text-basic-color']} />}
            onPress={() => navigation.goBack()}
        />
    );

    if (isLoading) {
        return (
            <Layout style={styles.loadingContainer} level="2">
                <Spinner size="large" />
            </Layout>
        );
    }

    if (!movie?.data) {
        return (
            <Layout style={styles.errorContainer} level="2">
                <Text category="h5">Movie not found</Text>
            </Layout>
        );
    }

    return (
        <Layout style={styles.container} level="2">
            <TopNavigation
                title={() => (
                    <Text category="h6" ellipsizeMode="tail">
                        {truncateText(movie?.data?.name, 30)}
                    </Text>
                )}
                alignment="center"
                accessoryLeft={renderBackAction}
                style={styles.topNavigation}
            />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {isPlaying && selectedEpisode ? (
                    <View style={styles.playerContainer}>
                        <WebView
                            source={{
                                uri: selectedEpisode.linkEmbed || selectedEpisode.linkM3u8 || '',
                            }}
                            style={styles.webView}
                            allowsFullscreenVideo
                        />
                    </View>
                ) : (
                    <TouchableOpacity onPress={handlePlayPress} style={styles.posterContainer}>
                        <Image
                            source={{ uri: movie.data.posterUrl || movie.data.thumbUrl }}
                            style={styles.poster}
                            contentFit="cover"
                        />
                        <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
                            <PlayCircle color={theme['text-basic-color']} size={64} />
                        </BlurView>
                    </TouchableOpacity>
                )}
                <Card style={styles.infoCard} status="basic">
                    <Text category="h5" style={styles.title}>
                        {movie.data.name}
                    </Text>
                    <Text category="s1" appearance="hint" style={styles.originalTitle}>
                        {movie.data.originName}
                    </Text>
                    <View style={styles.metaInfo}>
                        <Button
                            appearance="ghost"
                            status="basic"
                            accessoryLeft={(props) => (
                                <Calendar {...props} color={theme['text-hint-color']} />
                            )}
                            size="small"
                        >
                            {movie.data.year || 'N/A'}
                        </Button>
                        <Button
                            appearance="ghost"
                            status="basic"
                            accessoryLeft={(props) => (
                                <Clock {...props} color={theme['text-hint-color']} />
                            )}
                            size="small"
                        >
                            {movie.data.time || 'N/A'}
                        </Button>
                        {movie.data.tmdb?.voteAverage && (
                            <Button
                                appearance="ghost"
                                status="warning"
                                accessoryLeft={(props) => (
                                    <Star {...props} color={theme['color-warning-500']} />
                                )}
                                size="small"
                            >
                                {movie.data.tmdb.voteAverage.toFixed(1)}
                            </Button>
                        )}
                    </View>
                    <Divider style={styles.divider} />
                    <Text category="s1" style={styles.description}>
                        {movie.data.content}
                    </Text>
                    {movie.data.categories && movie.data.categories.length > 0 && (
                        <View style={styles.categoriesContainer}>
                            <Text category="s1" style={styles.categoriesTitle}>
                                Categories:
                            </Text>
                            <View style={styles.categoriesList}>
                                {movie.data.categories.map((category, index) => (
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
            </ScrollView>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
    },
    topNavigation: {
        backgroundColor: 'transparent',
    },
    playerContainer: {
        width: '100%',
        height: width * (9 / 16),
        backgroundColor: '#000',
    },
    webView: {
        flex: 1,
    },
    posterContainer: {
        width: '100%',
        height: height * 0.25,
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    blurOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    description: {
        lineHeight: 20,
        marginBottom: 16,
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
