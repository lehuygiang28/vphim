import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Button, Text, Toggle, Layout } from '@ui-kitten/components';
import { SkipBack, SkipForward } from 'lucide-react-native';
import { removeStyleProperty } from '~mb/libs/utils';

interface ExpoVideoPlayerProps {
    uri: string;
    onNext?: () => void;
    onPrevious?: () => void;
}

export default function ExpoVideoPlayer({ uri, onNext, onPrevious }: ExpoVideoPlayerProps) {
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
        <Layout style={styles.container} level="1">
            <VideoView
                ref={videoViewRef}
                player={player}
                style={styles.video}
                contentFit="contain"
                nativeControls
            />
            <View style={styles.controls}>
                <Button
                    appearance="ghost"
                    status="control"
                    accessoryLeft={(props) => <SkipBack {...removeStyleProperty(props)} />}
                    onPress={onPrevious}
                    disabled={!onPrevious}
                />
                <Toggle
                    checked={autoPlay}
                    onChange={handleAutoPlayToggle}
                    style={styles.autoPlayToggle}
                >
                    {(evaProps) => (
                        <Text {...evaProps} style={styles.autoPlayText}>
                            {' '}
                            Tự động phát
                        </Text>
                    )}
                </Toggle>
                <Button
                    appearance="ghost"
                    status="control"
                    accessoryLeft={(props) => <SkipForward {...removeStyleProperty(props)} />}
                    onPress={onNext}
                    disabled={!onNext}
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
    },
    autoPlayToggle: {
        transform: [{ scale: 0.8 }],
    },
    autoPlayText: {
        color: 'white',
        fontSize: 12,
    },
});
