import React, { useCallback, useState } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Pressable,
    SafeAreaView,
    RefreshControl,
    Alert,
} from 'react-native';
import { Link, useFocusEffect, router } from 'expo-router';
import { Text, useTheme, Spinner } from '@ui-kitten/components';
import { User, Info, MessageSquare, ChevronRight, FileText, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useSession } from '~mb/hooks/useSession';

export default function AccountScreen() {
    const { session, loading, loadSession, clearSession } = useSession();
    const [refreshing, setRefreshing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const theme = useTheme();

    const menuItems = [
        { title: 'Chính sách bảo vệ thông tin', icon: FileText, href: '/privacy-policy' },
        { title: 'Liên hệ', icon: MessageSquare, href: '/contact' },
        { title: 'Về ứng dụng', icon: Info, href: '/about' },
    ];

    useFocusEffect(
        useCallback(() => {
            loadSession();
        }, [loadSession]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadSession();
        setRefreshing(false);
    }, [loadSession]);

    const handleLogout = useCallback(() => {
        Alert.alert(
            'Xác nhận đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất?',
            [
                {
                    text: 'Hủy',
                    style: 'cancel',
                },
                {
                    text: 'Đăng xuất',
                    onPress: async () => {
                        setLoggingOut(true);
                        await clearSession();
                        // Add a slight delay for better UX
                        setTimeout(() => {
                            setLoggingOut(false);
                            router.replace('/');
                        }, 2000);
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: false },
        );
    }, [clearSession]);

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <Spinner size="large" />
                <Text category="s1" style={styles.loadingText}>
                    Loading...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <LinearGradient
            colors={[theme['color-primary-700'], theme['background-basic-color-1']]}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <View style={styles.headerContent}>
                        {session ? (
                            <View style={styles.profileInfo}>
                                <View style={styles.avatarContainer}>
                                    <User
                                        color={theme['color-primary-100']}
                                        size={64}
                                        style={styles.profileIcon}
                                    />
                                </View>
                                <Text category="h5" style={styles.userName}>
                                    {session.user.fullName || 'Movie Lover'}
                                </Text>
                                <Text category="s1" style={styles.userEmail}>
                                    {session.user.email}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.ctaContainer}>
                                <Text category="h4" style={styles.ctaText}>
                                    Sign up to watch more movies!
                                </Text>
                                <Link href="/auth" asChild>
                                    <Pressable style={styles.ctaButton}>
                                        <User
                                            color={theme['color-primary-100']}
                                            size={24}
                                            style={styles.buttonIcon}
                                        />
                                        <Text category="s1" style={styles.buttonText}>
                                            Login / Sign Up
                                        </Text>
                                    </Pressable>
                                </Link>
                            </View>
                        )}
                    </View>

                    <View
                        style={[
                            styles.contentContainer,
                            { backgroundColor: theme['background-basic-color-1'] },
                        ]}
                    >
                        {menuItems.map((item, index) => (
                            <Link key={item.title} href={item.href} asChild>
                                <Pressable style={styles.listItem}>
                                    <item.icon color={theme['text-basic-color']} size={24} />
                                    <Text category="s1" style={styles.listItemText}>
                                        {item.title}
                                    </Text>
                                    <ChevronRight color={theme['text-hint-color']} size={24} />
                                </Pressable>
                            </Link>
                        ))}
                        {session && (
                            <Pressable
                                style={styles.listItem}
                                onPress={handleLogout}
                                disabled={loggingOut}
                            >
                                {loggingOut ? (
                                    <Spinner size="small" status="danger" />
                                ) : (
                                    <LogOut color={theme['color-danger-500']} size={24} />
                                )}
                                <Text
                                    category="s1"
                                    style={[
                                        styles.listItemText,
                                        styles.logoutText,
                                        loggingOut && styles.logoutTextDisabled,
                                    ]}
                                >
                                    {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
    },
    headerContent: {
        paddingTop: 16,
        paddingBottom: 32,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileIcon: {
        marginBottom: 8,
    },
    userName: {
        marginBottom: 4,
        color: 'white',
    },
    userEmail: {
        color: 'white',
    },
    ctaContainer: {
        alignItems: 'center',
    },
    ctaText: {
        marginBottom: 16,
        textAlign: 'center',
        color: 'white',
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        minWidth: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontWeight: 'bold',
        color: 'white',
    },
    contentContainer: {
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    listItemText: {
        flex: 1,
        marginLeft: 16,
    },
    logoutText: {
        color: 'red',
    },
    logoutTextDisabled: {
        color: 'gray',
    },
});
