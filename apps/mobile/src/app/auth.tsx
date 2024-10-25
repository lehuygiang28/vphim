import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, SafeAreaView, Keyboard, Animated, View } from 'react-native';
import { router } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import {
    Button,
    Input,
    Text,
    Card,
    useTheme,
    TopNavigation,
    TopNavigationAction,
    Spinner,
} from '@ui-kitten/components';
import { Mail, ArrowLeft, Check } from 'lucide-react-native';

import authStore from '~mb/stores/authStore';

export default function AuthScreen() {
    const { session, setSession: updateSession, isLoading: sessionLoading } = authStore();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(false);
    const theme = useTheme();
    const [keyboardHeight] = useState(new Animated.Value(0));
    const [showOTP, setShowOTP] = useState(false);
    const [otp, setOTP] = useState('');
    const [countdown, setCountdown] = useState(180); // 3 minutes in seconds
    const [otpSentTime, setOtpSentTime] = useState<number | null>(null); // Timestamp for OTP sent

    useEffect(() => {
        if (session) {
            router.back();
        }
    }, [session]);

    useEffect(() => {
        const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => {
            Animated.timing(keyboardHeight, {
                toValue: e.endCoordinates.height,
                duration: 250,
                useNativeDriver: false,
            }).start();
        });

        const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
            Animated.timing(keyboardHeight, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false,
            }).start();
        });

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    }, [keyboardHeight]);

    useEffect(() => {
        if (otpSentTime) {
            const calculateRemainingTime = () => {
                const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
                const elapsedTime = currentTime - otpSentTime; // Calculate time elapsed since OTP was sent
                const remainingTime = Math.max(180 - elapsedTime, 0); // Calculate remaining countdown time
                setCountdown(remainingTime);
            };

            const interval = setInterval(calculateRemainingTime, 1000);

            return () => {
                clearInterval(interval);
            };
        }
    }, [otpSentTime]);

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailChange = (text: string) => {
        setEmail(text);
        setError('');
        setIsValid(isValidEmail(text));
    };

    const handleAuth = async () => {
        setError('');
        if (!email) {
            setError('Email không được để trống!');
            return;
        }
        if (!isValidEmail(email)) {
            setError('Email không hợp lệ!');
            return;
        }
        setIsLoading(true);
        try {
            const endpoint = 'login/pwdless';
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BASE_API_URL}/api/auth/${endpoint}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        returnUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
                    }),
                },
            );
            if (response.ok) {
                setShowOTP(true);
                setOtpSentTime(Math.floor(Date.now() / 1000)); // Save the current timestamp in seconds
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            setError('Gửi OTP thất bại. Vui lòng thử lại!');
            setShowOTP(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleAuth = () => {
        alert('Chức năng đang cập nhật!');
    };

    const handleOTPSubmit = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${process.env.EXPO_PUBLIC_BASE_API_URL}/api/auth/login/pwdless/validate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        hash: otp,
                        email: email,
                    }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                updateSession({ user: data });
                router.replace('/');
            } else {
                throw new Error('OTP validation failed');
            }
        } catch (error) {
            setError('OTP xác thực thất bại. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = useCallback((time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    const BackAction = () => (
        <TouchableOpacity>
            <TopNavigationAction
                icon={() => <ArrowLeft color={theme['text-basic-color']} />}
                onPress={() => router.back()}
            />
        </TouchableOpacity>
    );

    if (!session && sessionLoading) {
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
                    Đang xử lý...
                </Text>
            </SafeAreaView>
        );
    }

    if (session) {
        return null;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
            <Animated.View
                style={[
                    styles.container,
                    { backgroundColor: theme['background-basic-color-1'] },
                    { paddingBottom: keyboardHeight },
                ]}
            >
                <TopNavigation
                    accessoryLeft={BackAction}
                    title={() => <Text category="h6">Đăng nhập</Text>}
                    alignment="center"
                    style={styles.topNavigation}
                />
                <Card style={styles.card}>
                    <Text category="h1" style={styles.title}>
                        Đăng nhập
                    </Text>
                    <Input
                        placeholder="Email"
                        value={email}
                        onChangeText={handleEmailChange}
                        accessoryLeft={(props) => (
                            <Mail {...props} color={theme['text-basic-color']} />
                        )}
                        accessoryRight={(props) =>
                            isValid ? (
                                <Check {...props} color={theme['color-success-500']} />
                            ) : (
                                // eslint-disable-next-line react/jsx-no-useless-fragment
                                <></>
                            )
                        }
                        disabled={showOTP || isLoading}
                        style={styles.input}
                        status={error ? 'danger' : isValid ? 'success' : 'basic'}
                        caption={error ? () => <Text status="danger">{error}</Text> : undefined}
                    />
                    {showOTP && (
                        <>
                            <Input
                                placeholder="Enter OTP"
                                value={otp}
                                onChangeText={setOTP}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                            <View style={styles.resendContainer}>
                                <TouchableOpacity
                                    onPress={handleAuth}
                                    disabled={countdown > 0}
                                    style={[
                                        styles.resendButton,
                                        countdown > 0 && styles.resendButtonDisabled,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.resendText,
                                            countdown > 0 && styles.resendTextDisabled,
                                        ]}
                                    >
                                        Gửi lại OTP{' '}
                                        {countdown > 0 ? `(${formatTime(countdown)})` : ''}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                    <Button
                        onPress={showOTP ? handleOTPSubmit : handleAuth}
                        disabled={isLoading || (!showOTP && !isValid)}
                        accessoryLeft={
                            isLoading ? (props) => <Spinner {...props} size="small" /> : undefined
                        }
                    >
                        {isLoading
                            ? 'Đang xử lý...'
                            : showOTP
                            ? 'Xác nhận OTP'
                            : 'Tiếp tục với Email'}
                    </Button>
                    <Text style={styles.orText} category="s1">
                        hoặc
                    </Text>
                    <Button
                        onPress={handleGoogleAuth}
                        appearance="outline"
                        accessoryLeft={(props) => (
                            <AntDesign
                                {...props}
                                name="google"
                                size={20}
                                color={theme['text-basic-color']}
                            />
                        )}
                        style={styles.googleButton}
                    >
                        Tiếp tục với Google
                    </Button>
                </Card>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
    },
    topNavigation: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        elevation: 4,
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 16,
    },
    orText: {
        textAlign: 'center',
        marginVertical: 16,
    },
    googleButton: {
        marginBottom: 16,
    },
    resendContainer: {
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    resendButton: {
        padding: 8,
    },
    resendButtonDisabled: {
        opacity: 0.5,
    },
    resendText: {
        color: '#3366FF',
        fontWeight: 'bold',
    },
    resendTextDisabled: {
        color: '#8F9BB3',
    },
});
