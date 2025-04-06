import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    ScrollView,
    View,
    SafeAreaView,
    Linking,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
    Text,
    TopNavigation,
    TopNavigationAction,
    useTheme,
    Input,
    Button,
    Spinner,
} from '@ui-kitten/components';
import { ArrowLeft, Mail, Facebook, Twitter, Send, Copy, ExternalLink } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { removeStyleProperty } from '~mb/libs/utils';

// Define proper icon props type
type IconProps = {
    style?: Record<string, unknown>;
    size?: number | string;
    color?: string;
    [key: string]: unknown;
};

// Interface for contact info items
interface ContactInfoItem {
    label: string;
    value: string;
    icon: React.ElementType;
    action: () => void;
    copyAction: () => void;
}

export default function ContactScreen() {
    const theme = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const copyToClipboard = async (text: string) => {
        try {
            await Clipboard.setStringAsync(text);
            Alert.alert('Thành công', 'Đã sao chép vào bộ nhớ tạm');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            Alert.alert('Lỗi', 'Không thể sao chép vào bộ nhớ tạm');
        }
    };

    const contactInfo = [
        {
            label: 'Email',
            value: 'contact@vephim.online',
            icon: Mail,
            action: () => Linking.openURL('mailto:contact@vephim.online'),
            copyAction: () => copyToClipboard('contact@vephim.online'),
        },
    ];

    const handleSubmit = useCallback(() => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên của bạn');
            return;
        }

        if (!email.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập email của bạn');
            return;
        }

        if (!message.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập nội dung tin nhắn');
            return;
        }

        setIsSubmitting(true);

        // Simulate sending a message
        setTimeout(() => {
            setIsSubmitting(false);
            Alert.alert(
                'Đã gửi thành công',
                'Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setName('');
                            setEmail('');
                            setMessage('');
                        },
                    },
                ],
            );
        }, 1500);
    }, [name, email, message]);

    const BackAction = () => (
        <TopNavigationAction
            icon={(props) => <ArrowLeft {...removeStyleProperty(props || {})} />}
            onPress={handleBack}
        />
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme['background-basic-color-1'] }]}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <TopNavigation title="Liên hệ" alignment="center" accessoryLeft={BackAction} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerContainer}>
                    <Text category="h4" style={styles.headerTitle}>
                        Liên hệ với chúng tôi
                    </Text>
                    <Text category="p1" appearance="hint" style={styles.headerSubtitle}>
                        Nếu bạn có thắc mắc, góp ý hoặc cần hỗ trợ, vui lòng liên hệ theo thông tin
                        bên dưới hoặc gửi tin nhắn qua mẫu liên hệ.
                    </Text>
                </View>

                <View style={styles.contactInfoContainer}>
                    {contactInfo.map((item, index) => (
                        <View key={index} style={styles.contactInfoItem}>
                            <View style={styles.contactInfoHeader}>
                                <item.icon size={20} color={theme['color-primary-500']} />
                                <Text category="s1" style={styles.contactInfoLabel}>
                                    {item.label}:
                                </Text>
                            </View>
                            <View style={styles.contactInfoContent}>
                                <Text
                                    category="p2"
                                    style={styles.contactInfoValue}
                                    onPress={item.action}
                                >
                                    {item.value}
                                </Text>
                                <TouchableOpacity
                                    style={styles.copyButton}
                                    onPress={item.copyAction}
                                >
                                    <Copy size={16} color={theme['color-basic-600']} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.formContainer}>
                    <Text category="h6" style={styles.formTitle}>
                        Gửi tin nhắn
                    </Text>

                    <View style={styles.formGroup}>
                        <Text category="label" style={styles.label}>
                            Họ tên
                        </Text>
                        <Input
                            placeholder="Nhập họ tên của bạn"
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text category="label" style={styles.label}>
                            Email
                        </Text>
                        <Input
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text category="label" style={styles.label}>
                            Tin nhắn
                        </Text>
                        <Input
                            placeholder="Nhập nội dung tin nhắn"
                            value={message}
                            onChangeText={setMessage}
                            multiline={true}
                            textStyle={{ minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }}
                            style={styles.messageInput}
                        />
                    </View>

                    <Button
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        accessoryLeft={
                            isSubmitting
                                ? (props) => <Spinner size="small" status="control" />
                                : (props) => <Send size={16} {...removeStyleProperty(props || {})} />
                        }
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                    </Button>
                </View>

                <View style={styles.socialContainer}>
                    <Text category="s1" style={styles.socialTitle}>
                        Theo dõi chúng tôi
                    </Text>
                    <View style={styles.socialButtons}>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                            onPress={() => Linking.openURL('https://facebook.com/')}
                        >
                            <Facebook color="white" size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}
                            onPress={() => Linking.openURL('https://twitter.com/')}
                        >
                            <Twitter color="white" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text category="c1" appearance="hint" style={styles.footerText}>
                        © 2024 VePhim. Mọi quyền được bảo lưu.
                    </Text>
                    <Button
                        appearance="ghost"
                        size="tiny"
                        status="basic"
                        accessoryLeft={(props) => (
                            <ExternalLink size={14} {...removeStyleProperty(props || {})} />
                        )}
                        onPress={() => Linking.openURL('mailto:contact@vephim.online')}
                    >
                        Liên hệ
                    </Button>
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
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 24,
    },
    headerTitle: {
        marginBottom: 12,
    },
    headerSubtitle: {
        lineHeight: 20,
    },
    contactInfoContainer: {
        marginBottom: 24,
    },
    contactInfoItem: {
        marginBottom: 16,
    },
    contactInfoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactInfoLabel: {
        marginLeft: 8,
        fontWeight: 'bold',
    },
    contactInfoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 28,
    },
    contactInfoValue: {
        flex: 1,
    },
    copyButton: {
        padding: 8,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginVertical: 24,
    },
    formContainer: {
        marginBottom: 32,
    },
    formTitle: {
        marginBottom: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
    },
    input: {
        borderRadius: 8,
    },
    messageInput: {
        borderRadius: 8,
    },
    submitButton: {
        marginTop: 8,
    },
    socialContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    socialTitle: {
        marginBottom: 16,
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    socialButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
    },
});
