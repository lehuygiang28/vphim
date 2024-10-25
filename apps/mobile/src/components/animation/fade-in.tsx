import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const FadeInView: React.FC<{ children: React.ReactNode; delay?: number }> = ({
    children,
    delay = 0,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, delay]);

    return <Animated.View style={{ opacity: fadeAnim }}>{children}</Animated.View>;
};
