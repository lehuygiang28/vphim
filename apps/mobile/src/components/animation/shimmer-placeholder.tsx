import { useTheme } from '@ui-kitten/components';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface ShimmerPlaceholderProps {
    width: number;
    height: number;
}

export const ShimmerPlaceholder: React.FC<ShimmerPlaceholderProps> = ({ width, height }) => {
    const theme = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ).start();
    }, [animatedValue]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View
            style={{
                width,
                height,
                backgroundColor: theme['background-basic-color-2'],
                overflow: 'hidden',
            }}
        >
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    transform: [{ translateX }],
                }}
            >
                <LinearGradient
                    colors={[
                        theme['background-basic-color-2'],
                        theme['background-basic-color-3'],
                        theme['background-basic-color-2'],
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%' }}
                />
            </Animated.View>
        </View>
    );
};
