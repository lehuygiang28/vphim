'use client';

import { useLogin, useNotification } from '@refinedev/core';
import { Space, Form, Input, Typography, Divider, Button, Modal } from 'antd';
import { MailOutlined, GithubOutlined, GoogleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { LoginActionPayload } from '@/providers/auth-provider/types';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { LoginPwdless } from '@/validators';
import LoadingBtn from '@/components/button/loading-btn';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/loading';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const { Title, Text } = Typography;
const SEEM_SAFE_HASH_LENGTH = 30;

export enum LoginTitle {
    'follow' = 'Bạn cần đăng nhập để theo dõi phim',
    'default' = 'Tiếp tục vào VePhim',
}

export enum LoginErrorType {
    'block' = 'Your account is blocked, contact the administrator for more information',
    'not-admin' = 'You do not have permission.',
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
        const returnUrl = new URL(window?.location?.href);
        returnUrl.searchParams.set('to', redirectBackTo);

        const data: LoginActionPayload = {
            type: 'request-login',
            email: values.email,
            returnUrl: returnUrl.toString(),
        };

        return login({ ...data, redirectTo });
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
    };

    if (hash) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div>
            <Space align="start">
                <Link href={'/'} style={{ all: 'unset' }} onClick={onBack}>
                    <Button type="text">
                        <ArrowLeftOutlined />
                    </Button>
                </Link>
            </Space>
            <Space direction="vertical" align="center" size="small" style={{ width: '100%' }}>
                <Title level={3} style={{ marginBottom: '4px' }}>
                    {title}
                </Title>
                <Text>{t.useEmail}</Text>

                <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
                    <Controller<LoginPwdless>
                        name={'email'}
                        control={control}
                        render={({ field }) => (
                            <Form.Item<LoginPwdless>
                                name={'email'}
                                validateStatus={errors?.email ? 'error' : 'validating'}
                                help={<>{errors?.email?.message}</>}
                                rules={[{ required: true }]}
                            >
                                <Input
                                    {...field}
                                    prefix={<MailOutlined className="site-form-item-icon" />}
                                    placeholder="Email"
                                />
                            </Form.Item>
                        )}
                    />

                    <LoadingBtn
                        content={t.continue}
                        type="primary"
                        style={{ width: '240px' }}
                        size="middle"
                        htmlType="submit"
                        isValid={isValid}
                    />
                </form>
                <Divider plain>{t.or}</Divider>
                <Space direction="horizontal" align="center">
                    <LoadingBtn
                        type="primary"
                        style={{ width: '100px' }}
                        size="middle"
                        isValid={isValid}
                        onClick={() => handleSocialLogin('google')}
                    >
                        <GoogleOutlined /> Google
                    </LoadingBtn>
                    <LoadingBtn
                        type="primary"
                        style={{ width: '100px' }}
                        size="middle"
                        isValid={isValid}
                        onClick={() => handleSocialLogin('github')}
                    >
                        <GithubOutlined /> Github
                    </LoadingBtn>
                </Space>
                <Divider plain></Divider>
                <Text type="secondary">
                    {t.termsAgreement} <Link href="#">{t.terms}</Link> {t.ofUs}
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
