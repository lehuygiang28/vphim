import React, { useCallback, useEffect, useState } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    Pressable,
    SafeAreaView,
    RefreshControl,
    Alert,
    Image,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Text, useTheme, Spinner, Avatar } from '@ui-kitten/components';
import {
    User,
    Info,
    MessageSquare,
    ChevronRight,
    FileText,
    LogOut,
    Edit,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import authStore from '~mb/stores/authStore';
import { refreshSession } from '~mb/libs/authActions';
import { getOptimizedImageUrl } from '~fe/libs/utils/movie.util';

export default function AccountScreen() {
    const { session, isLoading, clearSession, setIsLoading } = authStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const theme = useTheme();

    const menuItems = [
        { title: 'Chính sách bảo vệ thông tin', icon: FileText, href: '/privacy-policy' },
        { title: 'Liên hệ', icon: MessageSquare, href: '/contact' },
        { title: 'Về ứng dụng', icon: Info, href: '/about' },
    ];

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setAvatarError(false);
            await refreshSession();
        } finally {
            setRefreshing(false);
        }
    }, []);

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
                        clearSession();
                        setTimeout(() => {
                            setLoggingOut(false);
                        }, 500);
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: false },
        );
    }, [clearSession]);

    useEffect(() => {
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset avatar error state when session changes
    useEffect(() => {
        setAvatarError(false);
    }, [session]);

    // Reset loggingOut state when session changes
    useEffect(() => {
        setLoggingOut(false);
    }, [session]);

    if (isLoading && !refreshing) {
        return (
            <SafeAreaView
                style={[
                    styles.container,
                    styles.loadingContainer,
                    { backgroundColor: theme['background-basic-color-1'] },
                ]}
            >
                <Spinner size="large" />
                <Text category="s1" style={styles.loadingText}>
                    Đang tải...
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <LinearGradient
            colors={[theme['color-primary-700'], theme['background-basic-color-1']]}
            style={styles.container}
            end={{ x: 0.1, y: 1 }}
            start={{ x: 0, y: 0 }}
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
                                    {session.user.avatar && !avatarError ? (
                                        <Avatar
                                            style={styles.avatar}
                                            source={{
                                                uri: getOptimizedImageUrl(
                                                    session.user.avatar?.url,
                                                    {
                                                        height: 350,
                                                        width: 350,
                                                        quality: 100,
                                                    },
                                                ),
                                            }}
                                            onError={() => setAvatarError(true)}
                                            size="giant"
                                        />
                                    ) : (
                                        <User
                                            color={theme['color-primary-100']}
                                            size={64}
                                            style={styles.profileIcon}
                                        />
                                    )}
                                </View>
                                <Text category="h5" style={styles.userName}>
                                    {session.user.fullName || 'Movie Lover'}
                                </Text>
                                <Text category="s1" style={styles.userEmail}>
                                    {session.user.email}
                                </Text>
                                <Pressable
                                    style={styles.editButton}
                                    onPress={() => router.push('/edit-profile')}
                                >
                                    <Edit size={16} color="white" style={styles.editIcon} />
                                    <Text category="s2" style={styles.editText}>
                                        Chỉnh sửa
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.ctaContainer}>
                                <Text category="h4" style={styles.ctaText}>
                                    Hãy tham gia VePhim để thưởng thức hàng ngàn nội dung phim miễn
                                    phí!
                                </Text>
                                <Link href="/auth" asChild>
                                    <Pressable style={styles.ctaButton}>
                                        <User
                                            color={theme['color-primary-100']}
                                            size={24}
                                            style={styles.buttonIcon}
                                        />
                                        <Text category="s1" style={styles.buttonText}>
                                            Đăng ký / Đăng nhập
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
                        {menuItems.map((item) => (
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
        paddingTop: 24,
        paddingBottom: 36,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        overflow: 'hidden',
    },
    avatar: {
        width: 110,
        height: 110,
    },
    profileIcon: {
        marginBottom: 8,
    },
    userName: {
        marginBottom: 8,
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    userEmail: {
        color: 'white',
        opacity: 0.9,
        marginBottom: 12,
    },
    ctaContainer: {
        alignItems: 'center',
    },
    ctaText: {
        marginBottom: 20,
        textAlign: 'center',
        color: 'white',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        minWidth: 220,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: 16,
    },
    contentContainer: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
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
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    editIcon: {
        marginRight: 4,
    },
    editText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
