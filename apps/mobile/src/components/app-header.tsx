import React, { useCallback } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { TopNavigation, Layout, useTheme } from '@ui-kitten/components';
import { Search } from 'lucide-react-native';

import { getOptimizedImageUrl } from '@/libs/utils/movie.util';

export default function AppHeader() {
    const router = useRouter();
    const theme = useTheme();

    const navigateToSearch = useCallback(() => {
        router.push('/search');
    }, [router]);

    const renderLeftContent = () => (
        <View style={styles.leftContent}>
            <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.9}>
                <Image
                    style={styles.logo}
                    source={{
                        uri: getOptimizedImageUrl(
                            'https://vephim.online/assets/images/logo-mini.png',
                            {
                                height: 80,
                                width: 80,
                                baseUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
                                quality: 100,
                            },
                        ),
                    }}
                />
            </TouchableOpacity>
        </View>
    );

    const renderRightContent = () => (
        <TouchableOpacity onPress={navigateToSearch}>
            <Search color={theme['text-basic-color']} size={24} />
        </TouchableOpacity>
    );

    return (
        <Layout style={styles.headerContainer} level="1">
            <TopNavigation
                style={styles.header}
                accessoryLeft={renderLeftContent}
                accessoryRight={renderRightContent}
            />
        </Layout>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: 40,
        zIndex: 2,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
