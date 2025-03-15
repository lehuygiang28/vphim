import React from 'react';
import { StyleSheet, ScrollView, View, SafeAreaView, Linking, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import {
    Text,
    TopNavigation,
    TopNavigationAction,
    useTheme,
    Divider,
    Button,
} from '@ui-kitten/components';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Helper function to filter out problematic style props from UI Kitten
const filterIconProps = (props: any) => {
    const { style, ...otherProps } = props;
    return otherProps;
};

export default function AboutScreen() {
    const theme = useTheme();

    const handleBack = () => {
        router.back();
    };

    const features = [
        {
            title: 'Tìm kiếm AI',
            icon: '🤖',
            description: 'Hệ thống tìm kiếm thông minh với AI hiểu được sở thích của bạn.',
        },
        {
            title: 'Phát trực tuyến siêu nhanh',
            icon: '⚡',
            description:
                'Trải nghiệm xem phim mượt mà, chất lượng cao với công nghệ phát trực tuyến tiên tiến.',
        },
        {
            title: 'Đa nền tảng',
            icon: '📱',
            description:
                'Sử dụng VePhim trên trình duyệt hoặc thiết bị di động với ứng dụng native.',
        },
        {
            title: 'Khám phá thông minh',
            icon: '🔍',
            description:
                'Tìm kiếm nội dung mới thông qua gợi ý thông minh dựa trên lịch sử xem và sở thích.',
        },
        {
            title: 'Bộ sưu tập cá nhân',
            icon: '💾',
            description: 'Tạo tài khoản miễn phí để lưu phim yêu thích, theo dõi lịch sử xem.',
        },
        {
            title: 'Trải nghiệm sạch',
            icon: '🛡️',
            description: 'Tận hưởng trải nghiệm không quảng cáo, tập trung vào nội dung.',
        },
    ];

    const BackAction = () => (
        <TopNavigationAction
            icon={(props) => <ArrowLeft {...filterIconProps(props)} />}
            onPress={handleBack}
        />
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <TopNavigation title="Về ứng dụng" alignment="center" accessoryLeft={BackAction} />

            <ScrollView style={styles.scrollView}>
                <LinearGradient
                    colors={[theme['color-primary-700'], theme['background-basic-color-1']]}
                    style={styles.header}
                    end={{ x: 0.5, y: 1 }}
                >
                    <Text category="h1" style={styles.appTitle}>
                        VePhim
                    </Text>
                    <Text category="s1" style={styles.appSubtitle}>
                        Xem phim trực tuyến, miễn phí và nhanh chóng
                    </Text>

                    <View style={styles.badgeContainer}>
                        <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
                    </View>

                    <Text category="p2" style={styles.appDescription}>
                        VePhim là nền tảng xem phim trực tuyến miễn phí với giao diện hiện đại và
                        nhiều tính năng hấp dẫn. Coi VePhim như thư viện phim cá nhân, có thể truy
                        cập mọi lúc mọi nơi miễn là có kết nối Internet.
                    </Text>
                </LinearGradient>

                <View style={styles.content}>
                    <Text category="h5" style={styles.sectionTitle}>
                        Tính năng nổi bật
                    </Text>

                    <View style={styles.featuresContainer}>
                        {features.map((feature, index) => (
                            <View key={index} style={styles.featureCard}>
                                <Text style={styles.featureIcon}>{feature.icon}</Text>
                                <Text category="h6" style={styles.featureTitle}>
                                    {feature.title}
                                </Text>
                                <Text category="p2" style={styles.featureDescription}>
                                    {feature.description}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Divider style={styles.divider} />

                    <Text category="h5" style={styles.sectionTitle}>
                        Công nghệ sử dụng
                    </Text>

                    <View style={styles.techContainer}>
                        <View style={styles.techSection}>
                            <Text category="s1" style={styles.techTitle}>
                                Frontend
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • Next.js & React
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • Ant Design
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • Vidstack (Media Player)
                            </Text>
                        </View>

                        <View style={styles.techSection}>
                            <Text category="s1" style={styles.techTitle}>
                                Backend
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • NestJS
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • MongoDB
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • Redis & Elasticsearch
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • Google Gemini
                            </Text>
                        </View>

                        <View style={styles.techSection}>
                            <Text category="s1" style={styles.techTitle}>
                                Mobile
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • React Native & Expo
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • UI Kitten
                            </Text>
                            <Text category="p2" style={styles.techItem}>
                                • Expo Video (Media Player)
                            </Text>
                        </View>
                    </View>

                    <Divider style={styles.divider} />

                    <Text category="h5" style={styles.sectionTitle}>
                        Phiên bản
                    </Text>
                    <Text category="p1" style={styles.versionText}>
                        1.0.0
                    </Text>

                    <Text category="c1" appearance="hint" style={styles.disclaimerText}>
                        VePhim được phát triển chỉ cho mục đích giáo dục và demo. Ứng dụng không lưu
                        trữ bất kỳ nội dung phim nào trên máy chủ của mình. Mọi nội dung đều được
                        tổng hợp từ các nguồn công khai trên Internet.
                    </Text>

                    <View style={styles.footer}>
                        <Text category="c1" appearance="hint" style={styles.copyrightText}>
                            © 2024 VePhim. Mọi quyền được bảo lưu.
                        </Text>
                        <Button
                            appearance="ghost"
                            size="tiny"
                            status="basic"
                            accessoryLeft={(props) => (
                                <ExternalLink size={14} {...filterIconProps(props)} />
                            )}
                            onPress={() => Linking.openURL('mailto:contact@vephim.online')}
                        >
                            Liên hệ
                        </Button>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appTitle: {
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    appSubtitle: {
        color: 'white',
        marginBottom: 24,
        textAlign: 'center',
        opacity: 0.9,
    },
    badgeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: 24,
    },
    appIcon: {
        width: 120,
        height: 120,
        borderRadius: 24,
    },
    appDescription: {
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    githubButton: {
        marginTop: 8,
    },
    content: {
        padding: 16,
    },
    sectionTitle: {
        marginBottom: 16,
        marginTop: 8,
    },
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    featureCard: {
        width: '48%',
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    featureIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    featureTitle: {
        marginBottom: 8,
        fontSize: 16,
    },
    featureDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    divider: {
        marginVertical: 24,
    },
    techContainer: {
        marginBottom: 24,
    },
    techSection: {
        marginBottom: 16,
    },
    techTitle: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    techItem: {
        marginBottom: 4,
        paddingLeft: 8,
    },
    versionText: {
        marginBottom: 24,
    },
    disclaimerText: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    copyrightText: {
        marginBottom: 8,
    },
});
