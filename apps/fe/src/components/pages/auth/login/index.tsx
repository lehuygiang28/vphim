'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLogin, useNotification } from '@refinedev/core';
import { Space, Form, Input, Typography, Divider, Button, Modal } from 'antd';
import {
    MailOutlined,
    GithubOutlined,
    GoogleOutlined,
    ArrowLeftOutlined,
    LoginOutlined,
} from '@ant-design/icons';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { signIn } from 'next-auth/react';

import { LoginPwdless } from '@/validators';
import type { LoginActionPayload } from '@/providers/auth-provider/types';
import LoadingBtn from '@/components/button/loading-btn';
import { LoadingSpinner } from '@/components/loading';

const { Title, Text, Link } = Typography;
const SEEM_SAFE_HASH_LENGTH = 30;

export enum LoginTitle {
    'follow' = 'Bạn cần đăng nhập để theo dõi phim',
    'default' = 'Tiếp tục vào VePhim',
}

export enum LoginErrorType {
    'block' = 'Tài khoản của bạn đã bị khóa, vui lòng liên hệ quản trị viên để biết thêm thông tin',
    'not-admin' = 'Bạn không có quyền truy cập.',
}

export type LoginProps = {
    onBack?: () => void;
    redirectTo?: string;
    lang?: 'vi' | 'en';
};

const translations = {
    vi: {
        followTitle: 'Bạn cần đăng nhập để thêm phim vào tủ',
        defaultTitle: 'Tiếp tục vào VePhim',
        useEmail: 'Sử dụng email của bạn',
        continue: 'Tiếp tục',
        or: 'hoặc với',
        termsAgreement: 'Bằng cách bấm tiếp tục, bạn đồng ý với',
        terms: 'Điều Khoản',
        ofUs: 'của chúng tôi',
        loginFailed: 'Đăng nhập thất bại, kiểm tra thông tin của bạn và thử lại sau',
        errorTitle: 'Lỗi',
    },
    en: {
        followTitle: 'You need to log in to follow the movie',
        defaultTitle: 'Continue to VePhim',
        useEmail: 'Use your email',
        continue: 'Continue',
        or: 'or with',
        termsAgreement: 'By clicking continue, you agree to our',
        terms: 'Terms',
        ofUs: '',
        loginFailed: 'Login failed, check your information and try again later',
        errorTitle: 'Error',
    },
};

export default function Login({ onBack, redirectTo = '/', lang = 'vi' }: LoginProps) {
    const router = useRouter();
    const params = useSearchParams();
    const { open } = useNotification();
    const { mutate: login } = useLogin();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const t = translations[lang];

    const title = params.get('title') === 'follow' ? t.followTitle : t.defaultTitle;
    const redirectBackTo = params.get('to') || '/';
    const hash = params.get('hash');
    const errorParam = params.get('e');

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<LoginPwdless>({
        resolver: classValidatorResolver(LoginPwdless),
        defaultValues: { email: '' },
    });

    const onSubmit: SubmitHandler<LoginPwdless> = async (values) => {
        setLoading(true);
        const returnUrl = new URL(window?.location?.href);
        returnUrl.searchParams.set('to', redirectBackTo);

        const data: LoginActionPayload = {
            type: 'request-login',
            email: values.email,
            returnUrl: returnUrl.toString(),
        };

        try {
            await login({ ...data, redirectTo });
        } finally {
            setLoading(false);
        }
    };

    const showErrorModal = (errorType: string) => {
        const message =
            LoginErrorType[errorType as keyof typeof LoginErrorType] || 'An unknown error occurred';
        setModalMessage(message);
        setIsModalVisible(true);
    };

    useEffect(() => {
        if (hash && hash.length >= SEEM_SAFE_HASH_LENGTH) {
            login({ type: 'login', hash, redirect: true, to: redirectBackTo });
        } else if (hash) {
            const cloneParams = new URLSearchParams(params);
            cloneParams.delete('hash');
            return router.replace(`/dang-nhap?${cloneParams.toString()}`);
        }
    }, [params, hash, redirectBackTo, router, login, open]);

    useEffect(() => {
        if (params.get('error') === 'failed_to_login') {
            open({
                type: 'error',
                message: t.loginFailed,
                key: 'failed_to_login',
            });
        }

        if (errorParam) {
            showErrorModal(errorParam);
        }
    }, [params, open, errorParam, t]);

    const handleSocialLogin = async (provider: string) => {
        setLoading(true);
        try {
            const result = await signIn(provider, {
                callbackUrl: redirectBackTo,
                redirect: false,
            });

            if (result?.error) {
                open({
                    type: 'error',
                    message: t.loginFailed,
                    key: 'login_error',
                });
            }

            if (result?.url) {
                router.replace(result.url);
            }
        } catch (error) {
            open({
                type: 'error',
                message: t.loginFailed,
                key: 'login_error',
            });
        } finally {
            setLoading(false);
        }
    };

    if (hash) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="login-form-container">
            <Space align="start" style={{ width: '100%', marginBottom: '16px' }}>
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    className="back-button"
                />
            </Space>
            <Space direction="vertical" align="center" size="small" style={{ width: '100%' }}>
                <Title level={3} style={{ marginBottom: '12px', textAlign: 'center' }}>
                    {title}
                </Title>
                <Text style={{ marginBottom: '16px', textAlign: 'center' }}>{t.useEmail}</Text>

                <form
                    autoComplete="off"
                    onSubmit={handleSubmit(onSubmit)}
                    style={{ width: '100%' }}
                >
                    <Controller<LoginPwdless>
                        name={'email'}
                        control={control}
                        render={({ field }) => (
                            <Form.Item<LoginPwdless>
                                name={'email'}
                                validateStatus={errors?.email ? 'error' : 'validating'}
                                help={<>{errors?.email?.message}</>}
                                rules={[{ required: true }]}
                                style={{ marginBottom: '20px' }}
                            >
                                <Input
                                    {...field}
                                    prefix={<MailOutlined className="site-form-item-icon" />}
                                    placeholder="Email"
                                    size="large"
                                    className="login-input"
                                />
                            </Form.Item>
                        )}
                    />

                    <LoadingBtn
                        content={t.continue}
                        type="primary"
                        style={{ width: '100%', height: '40px', borderRadius: '4px' }}
                        size="large"
                        htmlType="submit"
                        isValid={isValid}
                        loading={loading}
                        icon={<LoginOutlined />}
                    />
                </form>
                <Divider plain style={{ margin: '20px 0' }}>
                    {t.or}
                </Divider>
                <Space
                    direction="horizontal"
                    align="center"
                    size="middle"
                    style={{ width: '100%', justifyContent: 'center' }}
                >
                    <LoadingBtn
                        type="default"
                        style={{ width: '120px', height: '40px', borderRadius: '4px' }}
                        size="large"
                        isValid={true}
                        onClick={() => handleSocialLogin('google')}
                        loading={loading}
                    >
                        <GoogleOutlined /> Google
                    </LoadingBtn>
                    <LoadingBtn
                        type="default"
                        style={{ width: '120px', height: '40px', borderRadius: '4px' }}
                        size="large"
                        isValid={true}
                        onClick={() => handleSocialLogin('github')}
                        loading={loading}
                    >
                        <GithubOutlined /> Github
                    </LoadingBtn>
                </Space>
                <Divider plain style={{ margin: '20px 0' }}></Divider>
                <Text type="secondary" style={{ textAlign: 'center', fontSize: '13px' }}>
                    {t.termsAgreement} <Link href="/dieu-khoan">{t.terms}</Link> {t.ofUs}
                </Text>
            </Space>

            <Modal
                title={t.errorTitle}
                open={isModalVisible}
                onOk={() => setIsModalVisible(false)}
                onCancel={() => setIsModalVisible(false)}
            >
                <p>{modalMessage}</p>
            </Modal>
        </div>
    );
}
