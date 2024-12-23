import { useState, useCallback, useRef } from 'react';
import { Animated, RefreshControl as RefreshControlRN, StyleSheet } from 'react-native';
import { useTheme } from '@ui-kitten/components';

interface UseRefreshControlProps<T> {
    onRefresh: () => Promise<T>;
    fadeAnimation?: boolean;
    fadeDuration?: number;
}

interface UseRefreshControlReturn {
    refreshing: boolean;
    isLoading: boolean;
    fadeAnim: Animated.Value;
    handleRefresh: () => Promise<void>;
    RefreshControl: JSX.Element;
    refreshControlProps: {
        refreshing: boolean;
        onRefresh: () => Promise<void>;
        colors: string[];
        tintColor: string;
        progressViewOffset?: number;
        progressBackgroundColor: string;
    };
    overlayStyle: {
        backgroundColor: string;
        justifyContent: 'center';
        alignItems: 'center';
    } & typeof StyleSheet.absoluteFillObject;
}

export function useRefreshControl<T>({
    onRefresh,
    fadeAnimation = true,
    fadeDuration = 300,
}: UseRefreshControlProps<T>): UseRefreshControlReturn {
    const theme = useTheme();
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleFadeAnimation = useCallback(() => {
        if (!fadeAnimation) return Promise.resolve();

        return new Promise<void>((resolve) => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0.5,
                duration: fadeDuration,
                useNativeDriver: true,
            }).start(() => {
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: fadeDuration,
                    useNativeDriver: true,
                }).start(() => {
                    resolve();
                });
            });
        });
    }, [fadeAnim, fadeAnimation, fadeDuration]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        setIsLoading(true);
        try {
            await onRefresh();
            await handleFadeAnimation();
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setRefreshing(false);
            setIsLoading(false);
        }
    }, [onRefresh, handleFadeAnimation]);

    const refreshControlProps = {
        refreshing,
        onRefresh: handleRefresh,
        colors: [theme['color-primary-500']],
        tintColor: theme['color-primary-500'],
        progressBackgroundColor: theme['background-basic-color-2'],
        progressViewOffset: 20,
    };

    return {
        refreshing,
        isLoading,
        fadeAnim,
        handleRefresh,
        RefreshControl: <RefreshControlRN {...refreshControlProps} />,
        refreshControlProps,
        overlayStyle: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            ...StyleSheet.absoluteFillObject,
        },
    };
}
