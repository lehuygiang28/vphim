import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Layout } from '@ui-kitten/components';

import type { EpisodeServerDataType } from '~api/app/movies/movie.type';
import ExpoVideoPlayer from '~mb/components/expo-video-player';

interface VideoPlayerProps {
    isPlaying: boolean;
    selectedEpisode: EpisodeServerDataType | null;
    posterUrl: string;
    onPlayPress: () => void;
    onVideoError: () => void;
    onNextEpisode: () => void;
    onPreviousEpisode: () => void;
    isFirstEpisode: boolean;
    isLastEpisode: boolean;
}

export default function VideoPlayer({
    isPlaying,
    selectedEpisode,
    posterUrl,
    onPlayPress,
    onVideoError,
    onNextEpisode,
    onPreviousEpisode,
    isFirstEpisode,
    isLastEpisode,
}: VideoPlayerProps) {
    const [videoUrl, setVideoUrl] = useState<string>('');

    const prefetchM3u8 = useCallback(async (url: string) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return url;
            }
        } catch (error) {
            console.error('Error prefetching m3u8:', error);
        }
        return null;
    }, []);

    const getVideoUrl = useCallback(async () => {
        if (!selectedEpisode) return '';
        if (selectedEpisode.linkM3u8) {
            const m3u8Url = await prefetchM3u8(selectedEpisode.linkM3u8);
            return m3u8Url || selectedEpisode.linkEmbed || '';
        }
        return selectedEpisode.linkEmbed || '';
    }, [selectedEpisode, prefetchM3u8]);

    useEffect(() => {
        const fetchVideoUrl = async () => {
            const url = await getVideoUrl();
            setVideoUrl(url);
        };
        fetchVideoUrl();
    }, [getVideoUrl]);

    return (
        <Layout style={styles.playerContainer} level="2">
            <ExpoVideoPlayer
                uri={videoUrl}
                onNext={onNextEpisode}
                onPrevious={onPreviousEpisode}
                isFirstEpisode={isFirstEpisode}
                isLastEpisode={isLastEpisode}
            />
        </Layout>
    );
}

const styles = StyleSheet.create({
    playerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    posterContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
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
});
