import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Button, Text, Toggle, Layout, useTheme } from '@ui-kitten/components';
import { SkipBack, SkipForward } from 'lucide-react-native';

import { removeStyleProperty } from '~mb/libs/utils';

interface ExpoVideoPlayerProps {
    uri: string;
    onNext?: () => void;
    onPrevious?: () => void;
    isFirstEpisode: boolean;
    isLastEpisode: boolean;
}

export default function ExpoVideoPlayer({
    uri,
    onNext,
    onPrevious,
    isFirstEpisode,
    isLastEpisode,
}: ExpoVideoPlayerProps) {
    const theme = useTheme();
    const player = useVideoPlayer({ uri });
    const [autoPlay, setAutoPlay] = useState(true);
    const videoViewRef = useRef<VideoView>(null);

    const handleAutoPlayToggle = useCallback((isChecked: boolean) => {
        setAutoPlay(isChecked);
    }, []);

    useEffect(() => {
        const playToEndHandler = () => {
            if (autoPlay && onNext) {
                onNext();
            }
        };

        const statusChangeHandler = (event: { status: string }) => {
            if (event.status === 'readyToPlay' && autoPlay) {
                player.play();
            }
        };

        player.addListener('playToEnd', playToEndHandler);
        player.addListener('statusChange', statusChangeHandler);

        return () => {
            player.removeListener('playToEnd', playToEndHandler);
            player.removeListener('statusChange', statusChangeHandler);
        };
    }, [player, autoPlay, onNext]);

    useEffect(() => {
        if (autoPlay && player.status === 'readyToPlay') {
            player.play();
        }
    }, [autoPlay, player]);

    return (
        <Layout
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
            level="1"
        >
            <VideoView
                ref={videoViewRef}
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls
            />
            <View style={[styles.controls, { backgroundColor: theme['background-basic-color-4'] }]}>
                <Button
                    appearance="ghost"
                    status="control"
                    accessoryLeft={(props) => (
                        <SkipBack
                            {...removeStyleProperty(props)}
                            color={
                                isFirstEpisode || !onPrevious
                                    ? theme['text-disabled-color']
                                    : theme['text-basic-color']
                            }
                            size={24}
                        />
                    )}
                    onPress={onPrevious}
                    disabled={isFirstEpisode || !onPrevious}
                    size="small"
                />
                <View style={styles.autoPlayContainer}>
                    <Toggle
                        checked={autoPlay}
                        onChange={handleAutoPlayToggle}
                        style={styles.autoPlayToggle}
                    />
                    <Text style={[styles.autoPlayText, { color: theme['text-basic-color'] }]}>
                        Tự động phát
                    </Text>
                </View>
                <Button
                    appearance="ghost"
                    status="control"
                    accessoryLeft={(props) => (
                        <SkipForward
                            {...removeStyleProperty(props)}
                            color={
                                isLastEpisode || !onNext
                                    ? theme['text-disabled-color']
                                    : theme['text-basic-color']
                            }
                            size={24}
                        />
                    )}
                    onPress={onNext}
                    disabled={isLastEpisode || !onNext}
                    size="small"
                />
            </View>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: 'black',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'black',
        paddingHorizontal: 10,
    },
    autoPlayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    autoPlayToggle: {
        transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    autoPlayText: {
        fontSize: 12,
        marginLeft: 8,
    },
});
