import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View, Dimensions } from 'react-native';
import { Layout, useTheme } from '@ui-kitten/components';
import { useOne } from '@refinedev/core';
import { useLocalSearchParams } from 'expo-router';

import { GET_MOVIE_QUERY } from '@/queries/movies';
import type { EpisodeServerDataType, MovieType } from '~api/app/movies/movie.type';

import { MovieRelated } from '~mb/components/list/movie-related';
import { MovieComments } from '~mb/components/comment';
import LoadingSpinner from '~mb/components/screens/movie/loading';
import VideoPlayer from '~mb/components/screens/movie/player';
import EpisodeSelector from '~mb/components/screens/movie/episode-selector';
import MovieInfo from '~mb/components/screens/movie/info';
import ErrorModal from '~mb/components/screens/movie/error-modal';

export default function MovieScreen() {
    const theme = useTheme();
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);
    const [selectedServerIndex, setSelectedServerIndex] = useState(0);
    const [selectedEpisodeIndex, setSelectedEpisodeIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
    const [playerHeight, setPlayerHeight] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    const { data: movie, isLoading } = useOne<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: {
            gqlQuery: GET_MOVIE_QUERY,
            operation: 'movie',
            variables: { input: { slug } },
        },
        id: Array.isArray(slug) ? slug[0] : slug,
    });

    useEffect(() => {
        if (movie?.data?.episode && movie.data.episode.length > 0) {
            const firstServer = movie.data.episode[0];
            if (firstServer.serverData && firstServer.serverData.length > 0) {
                setSelectedEpisode(firstServer.serverData[0]);
                setSelectedServerIndex(0);
                setSelectedEpisodeIndex(0);
            }
        }
    }, [movie]);

    const calculatePlayerHeight = useCallback(() => {
        const { width } = Dimensions.get('window');
        const aspectRatio = 16 / 9;
        return width / aspectRatio;
    }, []);

    useEffect(() => {
        setPlayerHeight(calculatePlayerHeight());
    }, [calculatePlayerHeight]);

    const handlePlayPress = useCallback(() => {
        if (!error && selectedEpisode) {
            setIsPlaying(true);
        } else {
            setIsErrorModalVisible(true);
        }
    }, [error, selectedEpisode]);

    const handleEpisodeSelect = useCallback(
        (episode: EpisodeServerDataType, serverIndex: number, episodeIndex: number) => {
            setSelectedEpisode(episode);
            setSelectedServerIndex(serverIndex);
            setSelectedEpisodeIndex(episodeIndex);
            setIsPlaying(true);
            setError(null);
        },
        [],
    );

    const handleVideoError = useCallback(() => {
        setError('Unable to play video. Please try again later or choose a different source.');
        setIsErrorModalVisible(true);
        setIsPlaying(false);
    }, []);

    const handleNextEpisode = useCallback(() => {
        if (movie?.data?.episode) {
            const currentServer = movie.data.episode[selectedServerIndex];
            if (selectedEpisodeIndex < currentServer.serverData.length - 1) {
                handleEpisodeSelect(
                    currentServer.serverData[selectedEpisodeIndex + 1],
                    selectedServerIndex,
                    selectedEpisodeIndex + 1,
                );
            } else if (selectedServerIndex < movie.data.episode.length - 1) {
                const nextServer = movie.data.episode[selectedServerIndex + 1];
                handleEpisodeSelect(nextServer.serverData[0], selectedServerIndex + 1, 0);
            }
        }
    }, [movie, selectedServerIndex, selectedEpisodeIndex, handleEpisodeSelect]);

    const handlePreviousEpisode = useCallback(() => {
        if (movie?.data?.episode) {
            if (selectedEpisodeIndex > 0) {
                const currentServer = movie.data.episode[selectedServerIndex];
                handleEpisodeSelect(
                    currentServer.serverData[selectedEpisodeIndex - 1],
                    selectedServerIndex,
                    selectedEpisodeIndex - 1,
                );
            } else if (selectedServerIndex > 0) {
                const previousServer = movie.data.episode[selectedServerIndex - 1];
                handleEpisodeSelect(
                    previousServer.serverData[previousServer.serverData.length - 1],
                    selectedServerIndex - 1,
                    previousServer.serverData.length - 1,
                );
            }
        }
    }, [movie, selectedServerIndex, selectedEpisodeIndex, handleEpisodeSelect]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!movie?.data) {
        return <Layout style={styles.errorContainer} level="2" />;
    }

    return (
        <SafeAreaView
            style={[styles.safeArea, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <Layout style={styles.container} level="1">
                <View style={[styles.playerContainer, { height: playerHeight + 60 }]}>
                    <VideoPlayer
                        isPlaying={isPlaying}
                        selectedEpisode={selectedEpisode}
                        posterUrl={movie.data.posterUrl || movie.data.thumbUrl}
                        onPlayPress={handlePlayPress}
                        onVideoError={handleVideoError}
                        onNextEpisode={handleNextEpisode}
                        onPreviousEpisode={handlePreviousEpisode}
                    />
                </View>
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: playerHeight + 60 },
                    ]}
                >
                    <View style={styles.contentContainer}>
                        <EpisodeSelector
                            episodes={movie?.data?.episode || []}
                            selectedEpisode={selectedEpisode}
                            onEpisodeSelect={handleEpisodeSelect}
                        />
                        <MovieInfo movie={movie.data} />
                        <MovieRelated movie={movie.data} />
                        <MovieComments movieId={movie.data._id?.toString()} />
                    </View>
                </ScrollView>
                <ErrorModal
                    theme={theme}
                    visible={isErrorModalVisible}
                    onClose={() => setIsErrorModalVisible(false)}
                    errorMessage={error || 'An error occurred'}
                />
            </Layout>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
    },
    scrollContent: {
        flexGrow: 1,
    },
    contentContainer: {
        paddingTop: 8,
    },
});
