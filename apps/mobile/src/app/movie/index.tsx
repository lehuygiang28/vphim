import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { useOne } from '@refinedev/core';
import {
    useTheme,
    Text,
    Title,
    Paragraph,
    Chip,
    ActivityIndicator,
    IconButton,
    Surface,
    Button,
} from 'react-native-paper';
import { Image } from 'expo-image';
import { Calendar, Eye, Clock, Play, X, ChevronUp, ChevronDown } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import { BlurView } from 'expo-blur';

import { GET_MOVIE_QUERY } from '@/queries/movies';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import type { EpisodeServerDataType } from 'apps/api/src/app/movies/movie.type';
import MovieEpisode from './movie-episode';

type RootStackParamList = {
    Home: undefined;
    Explore: { searchQuery: string };
    Account: undefined;
    MovieDetails: { slug: string; episodeSlug?: string };
};

type MovieDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'MovieDetails'>;

const { width, height } = Dimensions.get('window');

export default function MovieDetailsScreen({ route, navigation }: MovieDetailsScreenProps) {
    const { slug, episodeSlug } = route.params;
    const theme = useTheme();
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedServerIndex, setSelectedServerIndex] = useState(0);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [useEmbedLink, setUseEmbedLink] = useState(false);
    const [isM3u8Available, setIsM3u8Available] = useState(true);
    const episodeScrollViewRef = useRef<ScrollView>(null);

    const { data, isLoading } = useOne<MovieResponseDto>({
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
        id: slug,
    });

    const toggleDescription = useCallback(() => {
        setIsDescriptionExpanded(!isDescriptionExpanded);
    }, [isDescriptionExpanded]);

    const preFetchM3u8 = useCallback(async (url: string) => {
        try {
            const response = await fetch(url, { method: 'GET' });
            if (!response.ok) {
                throw new Error('M3U8 file not available');
            }
            setIsM3u8Available(true);
        } catch (error) {
            console.error('Error pre-fetching M3U8:', error);
            setIsM3u8Available(false);
        }
    }, []);

    useEffect(() => {
        if (data?.data) {
            const movie = data.data;
            if (
                movie?.trailerUrl &&
                (episodeSlug === 'trailer' ||
                    !movie.episode ||
                    movie.episode.length === 0 ||
                    (!movie.episode[0].serverData[0].linkM3u8 &&
                        !movie.episode[0].serverData[0].linkEmbed))
            ) {
                setSelectedEpisode({
                    slug: 'trailer',
                    name: 'Trailer',
                    filename: 'trailer',
                    linkM3u8: movie.trailerUrl,
                    linkEmbed: movie.trailerUrl,
                });
            } else if (movie?.episode && movie.episode.length > 0) {
                const episode = movie.episode.find((ep) =>
                    ep.serverData.some((server) => server.slug === episodeSlug),
                );
                if (episode) {
                    const serverIndex = movie.episode.findIndex(
                        (ep) => ep.serverName === episode.serverName,
                    );
                    setSelectedServerIndex(serverIndex !== -1 ? serverIndex : 0);
                    const currentEpisode =
                        episode.serverData.find((server) => server.slug === episodeSlug) || null;
                    setSelectedEpisode(currentEpisode);

                    if (currentEpisode) {
                        if (currentEpisode.linkM3u8) {
                            preFetchM3u8(currentEpisode.linkM3u8);
                        } else if (currentEpisode.linkEmbed) {
                            setUseEmbedLink(true);
                            setIsM3u8Available(false);
                        } else {
                            setError('Video is being updated. Please try again later.');
                        }
                    }
                } else {
                    // If no episode is selected, default to the first episode
                    const firstEpisode = movie.episode[0].serverData[0];
                    setSelectedEpisode(firstEpisode);
                    if (firstEpisode.linkM3u8) {
                        preFetchM3u8(firstEpisode.linkM3u8);
                    } else if (firstEpisode.linkEmbed) {
                        setUseEmbedLink(true);
                        setIsM3u8Available(false);
                    }
                }
            } else {
                setError('Video is being updated. Please try again later.');
            }
        }
    }, [data, episodeSlug, preFetchM3u8]);

    const handlePlayPress = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const handleEpisodePress = useCallback(
        (episode: EpisodeServerDataType) => {
            setSelectedEpisode(episode);
            setIsPlaying(true);
            setUseEmbedLink(false);
            setIsM3u8Available(true);
            if (episode.linkM3u8) {
                preFetchM3u8(episode.linkM3u8);
            } else if (episode.linkEmbed) {
                setUseEmbedLink(true);
                setIsM3u8Available(false);
            }
            navigation.setParams({ episodeSlug: episode.slug });
        },
        [navigation, preFetchM3u8],
    );

    const handleVideoError = useCallback(() => {
        if (isM3u8Available && !useEmbedLink && selectedEpisode?.linkEmbed) {
            setUseEmbedLink(true);
        } else {
            setError('Unable to play video. Please try again later.');
        }
    }, [isM3u8Available, useEmbedLink, selectedEpisode]);

    const handleCloseVideo = useCallback(() => {
        setIsPlaying(false);
    }, []);

    const handleServerChange = useCallback(
        (index: number) => {
            setSelectedServerIndex(index);
            const newEpisode = data?.data?.episode?.[index]?.serverData[0];
            if (newEpisode) {
                handleEpisodePress(newEpisode);
            }
        },
        [data?.data?.episode, handleEpisodePress],
    );

    useEffect(() => {
        if (episodeScrollViewRef.current && selectedEpisode) {
            episodeScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
    }, [selectedEpisode]);

    if (isLoading) {
        return (
            <View
                style={[
                    styles.container,
                    styles.centerContent,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const movie = data?.data;

    if (!movie) {
        return (
            <View
                style={[
                    styles.container,
                    styles.centerContent,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <Text style={{ color: theme.colors.error }}>Movie not found</Text>
            </View>
        );
    }

    const getVideoUrl = (): string => {
        if (!selectedEpisode) return '';

        if (!isM3u8Available || useEmbedLink) {
            return selectedEpisode.linkEmbed || '';
        }

        if (!selectedEpisode.linkM3u8) {
            return '';
        }

        return `${process.env.EXPO_PUBLIC_BASE_PLAYER_URL}/player/${encodeURIComponent(
            selectedEpisode.linkM3u8,
        )}?movieSlug=${encodeURIComponent(movie.slug)}&poster=${encodeURIComponent(
            movie.thumbUrl?.includes('/phimimg.com/upload')
                ? movie.thumbUrl
                : movie.posterUrl || '',
        )}&ep=${encodeURIComponent(selectedEpisode.slug)}`;
    };

    const videoUrl = getVideoUrl();

    const renderVideoPlayer = () => {
        if (error) {
            return (
                <View style={[styles.errorContainer, { backgroundColor: theme.colors.error }]}>
                    <Text style={[styles.errorText, { color: theme.colors.onError }]}>{error}</Text>
                </View>
            );
        }

        if (!isPlaying) {
            return (
                <View style={styles.posterContainer}>
                    <Image
                        source={{
                            uri: getOptimizedImageUrl(movie.posterUrl || movie.thumbUrl, {
                                baseUrl: process.env.EXPO_PUBLIC_BASE_API_URL || '',
                                width: 1200,
                                height: 720,
                            }),
                        }}
                        style={styles.poster}
                        contentFit="cover"
                    />
                    <BlurView intensity={80} style={styles.blurOverlay}>
                        <TouchableOpacity
                            onPress={handlePlayPress}
                            style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
                        >
                            <Play size={32} color={theme.colors.onPrimary} />
                        </TouchableOpacity>
                    </BlurView>
                </View>
            );
        }

        if (!selectedEpisode || !videoUrl) {
            return (
                <View style={[styles.noVideoContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.noVideoText, { color: theme.colors.onSurface }]}>
                        No video available for this movie.
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.videoContainer}>
                <WebView
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    allowsFullscreenVideo
                    javaScriptEnabled
                    domStorageEnabled
                    onError={handleVideoError}
                />
                <IconButton
                    icon={() => <X size={24} color={theme.colors.onSurface} />}
                    onPress={handleCloseVideo}
                    style={styles.closeButton}
                />
            </View>
        );
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            <StatusBar barStyle="light-content" />
            {renderVideoPlayer()}
            <Surface style={[styles.content, { elevation: 1 }]}>
                <Title style={[styles.title, { color: theme.colors.primary }]}>{movie.name}</Title>
                <Text style={[styles.originalTitle, { color: theme.colors.onSurface }]}>
                    {movie.originName}
                </Text>
                <View style={styles.metadataContainer}>
                    <Chip
                        icon={() => <Calendar size={16} color={theme.colors.primary} />}
                        style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
                        textStyle={{ color: theme.colors.onPrimaryContainer }}
                    >
                        {movie.year || 'N/A'}
                    </Chip>
                    <Chip
                        icon={() => <Eye size={16} color={theme.colors.secondary} />}
                        style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
                        textStyle={{ color: theme.colors.onSecondaryContainer }}
                    >
                        {movie.view?.toLocaleString() || '0'} views
                    </Chip>
                    <Chip
                        icon={() => <Clock size={16} color={theme.colors.tertiary} />}
                        style={[styles.chip, { backgroundColor: theme.colors.tertiaryContainer }]}
                        textStyle={{ color: theme.colors.onTertiaryContainer }}
                    >
                        {movie.time || 'N/A'}
                    </Chip>
                </View>
                <View>
                    <Paragraph
                        style={[styles.description, { color: theme.colors.onSurface }]}
                        numberOfLines={isDescriptionExpanded ? undefined : 3}
                    >
                        {movie.content}
                    </Paragraph>
                    <Button
                        onPress={toggleDescription}
                        style={styles.expandButton}
                        icon={() =>
                            isDescriptionExpanded ? (
                                <ChevronUp size={24} color={theme.colors.primary} />
                            ) : (
                                <ChevronDown size={24} color={theme.colors.primary} />
                            )
                        }
                    >
                        {isDescriptionExpanded ? 'Ẩn bớt' : 'Xem thêm'}
                    </Button>
                </View>

                <MovieEpisode
                    movie={movie}
                    activeEpisodeSlug={selectedEpisode?.slug}
                    activeServerIndex={selectedServerIndex}
                    onEpisodePress={handleEpisodePress}
                />
            </Surface>
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
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    posterContainer: {
        width: '100%',
        height: height * 0.3,
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
    videoContainer: {
        width: '100%',
        height: width * (9 / 16),
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        padding: 16,
        margin: 16,
        borderRadius: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    originalTitle: {
        fontSize: 18,
        marginBottom: 12,
        fontStyle: 'italic',
    },
    metadataContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 8,
    },
    expandButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    episodeTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    serverList: {
        marginBottom: 16,
    },
    serverButton: {
        marginRight: 8,
    },
    episodeList: {
        marginBottom: 16,
    },
    episodeListContent: {
        paddingRight: 16,
    },
    episodeButton: {
        padding: 12,
        marginRight: 8,
        borderRadius: 8,
        minWidth: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedEpisodeButton: {
        backgroundColor: '#007AFF',
    },
    episodeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    selectedEpisodeButtonText: {
        color: 'white',
    },
    errorContainer: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    noVideoContainer: {
        width: '100%',
        height: width * (9 / 16),
        justifyContent: 'center',
        alignItems: 'center',
    },
    noVideoText: {
        fontSize: 16,
    },
});
