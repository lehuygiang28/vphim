import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { TopNavigation, Layout, useTheme } from '@ui-kitten/components';
import { Film, Search } from 'lucide-react-native';

export default function AppHeader() {
    const router = useRouter();
    const theme = useTheme();

    const navigateToSearch = () => {
        router.push('/search');
    };

    const renderLeftContent = () => (
        <View style={styles.leftContent}>
            <Film color={theme['text-basic-color']} size={32} />
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
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
