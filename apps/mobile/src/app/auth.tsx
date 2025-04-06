import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

import { useAuth } from '~mb/hooks/use-auth';

type AuthScreenState = 'EMAIL_INPUT' | 'OTP_INPUT';

export default function AuthScreen() {
    const { isLoading: authLoading, isAuthenticated, login, requestOTP } = useAuth();

    // Form state
    const [email, setEmail] = useState('');
    const [otp, setOTP] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [screenState, setScreenState] = useState<AuthScreenState>('EMAIL_INPUT');

    // Email validation
    const [isEmailValid, setIsEmailValid] = useState(false);

    // Keyboard handling
    const [keyboardHeight] = useState(new Animated.Value(0));

    // OTP timer state
    const [otpSentTime, setOtpSentTime] = useState<number | null>(null);
    const [countdown, setCountdown] = useState(180); // 3 minutes in seconds

    // Theme
    const theme = useTheme();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.back();
        }
    }, [isAuthenticated]);

    // Keyboard handling
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

    // OTP countdown timer
    useEffect(() => {
        if (otpSentTime) {
            const calculateRemainingTime = () => {
                const currentTime = Math.floor(Date.now() / 1000);
                const elapsedTime = currentTime - otpSentTime;
                const remainingTime = Math.max(180 - elapsedTime, 0);
                setCountdown(remainingTime);
            };

            const interval = setInterval(calculateRemainingTime, 1000);
            return () => clearInterval(interval);
        }
    }, [otpSentTime]);

    // Email validation function
    const validateEmail = useCallback((email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }, []);

    // Handle email input change
    const handleEmailChange = useCallback(
        (text: string) => {
            setEmail(text);
            setError('');
            setIsEmailValid(validateEmail(text));
        },
        [validateEmail],
    );

    // Request OTP
    const handleRequestOTP = useCallback(async () => {
        setError('');

        if (!email) {
            setError('Email không được để trống!');
            return;
        }

        if (!isEmailValid) {
            setError('Email không hợp lệ!');
            return;
        }

        setIsLoading(true);

        try {
            const success = await requestOTP(email);

            if (success) {
                setScreenState('OTP_INPUT');
                setOtpSentTime(Math.floor(Date.now() / 1000));
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            setError('Gửi OTP thất bại. Vui lòng thử lại!');
            setScreenState('EMAIL_INPUT');
        } finally {
            setIsLoading(false);
        }
    }, [email, isEmailValid, requestOTP]);

    // Handle OTP verification
    const handleVerifyOTP = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const success = await login(email, otp);

            if (success) {
                router.replace('/');
            } else {
                throw new Error('OTP validation failed');
            }
        } catch (error) {
            setError('OTP xác thực thất bại. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    }, [email, otp, login]);

    // Handle Google authentication
    const handleGoogleAuth = useCallback(() => {
        alert('Chức năng đang cập nhật!');
    }, []);

    // Format time for countdown display
    const formatTime = useCallback((time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    // Back action component
    const BackAction = useMemo(
        () => () =>
            (
                <TouchableOpacity>
                    <TopNavigationAction
                        icon={() => <ArrowLeft color={theme['text-basic-color']} />}
                        onPress={() => router.back()}
                    />
                </TouchableOpacity>
            ),
        [theme],
    );

    // Handle primary button action based on current screen state
    const handlePrimaryAction = useCallback(() => {
        if (screenState === 'EMAIL_INPUT') {
            return handleRequestOTP();
        } else {
            return handleVerifyOTP();
        }
    }, [screenState, handleRequestOTP, handleVerifyOTP]);

    // Loading state UI
    if (authLoading) {
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

    // Hide component if already logged in
    if (isAuthenticated) {
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
                        accessoryLeft={(props) => {
                            const { style, ...p } = props || {};
                            return <Mail {...p} color={theme['text-basic-color']} />;
                        }}
                        accessoryRight={(props) => {
                            const { style, ...p } = props || {};
                            return isEmailValid ? (
                                <Check {...p} color={theme['color-success-500']} />
                            ) : (
                                // eslint-disable-next-line react/jsx-no-useless-fragment
                                <></>
                            );
                        }}
                        disabled={screenState === 'OTP_INPUT' || isLoading}
                        style={styles.input}
                        status={error ? 'danger' : isEmailValid ? 'success' : 'basic'}
                        caption={error ? () => <Text status="danger">{error}</Text> : undefined}
                    />
                    {screenState === 'OTP_INPUT' && (
                        <>
                            <Input
                                placeholder="Nhập mã OTP"
                                value={otp}
                                onChangeText={setOTP}
                                style={styles.input}
                                keyboardType="numeric"
                            />
                            <View style={styles.resendContainer}>
                                <TouchableOpacity
                                    onPress={handleRequestOTP}
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
                        onPress={handlePrimaryAction}
                        disabled={isLoading || (screenState === 'EMAIL_INPUT' && !isEmailValid)}
                        accessoryLeft={
                            isLoading
                                ? (props) => {
                                      const { style, ...p } = props || {};
                                      return <Spinner {...p} size="small" />;
                                  }
                                : undefined
                        }
                    >
                        {isLoading
                            ? 'Đang xử lý...'
                            : screenState === 'OTP_INPUT'
                            ? 'Xác nhận OTP'
                            : 'Tiếp tục với Email'}
                    </Button>
                    {/* <Text style={styles.orText} category="s1">
                        hoặc
                    </Text>
                    <Button
                        onPress={handleGoogleAuth}
                        appearance="outline"
                        accessoryLeft={(props) => {
                            const { style, ...p } = props || {};
                            return (
                                <AntDesign
                                    {...p}
                                    name="google"
                                    size={20}
                                    color={theme['text-basic-color']}
                                />
                            );
                        }}
                        style={styles.googleButton}
                    >
                        Tiếp tục với Google
                    </Button> */}
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
