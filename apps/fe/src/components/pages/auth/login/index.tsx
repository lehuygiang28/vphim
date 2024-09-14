'use client';

import { useLogin, useNotification } from '@refinedev/core';
import { Space, Form, Input, Typography, Divider, Button } from 'antd';
import { MailOutlined, GithubOutlined, GoogleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { LoginActionPayload } from '@/providers/auth-provider/types';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { LoginPwdless } from '@/validators';
import LoadingBtn from '@/components/button/loading-btn';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const { Title, Text } = Typography;
const SEEM_SAFE_HASH_LENGTH = 30;

export type LoginProps = {
    onBack?: () => void;
};

export default function Login({ onBack }: LoginProps) {
    const router = useRouter();
    const params = useSearchParams();
    const { open } = useNotification();
    const { mutate: login } = useLogin();

    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<LoginPwdless>({
        resolver: classValidatorResolver(LoginPwdless),
        defaultValues: { email: '' },
    });

    const onSubmit: SubmitHandler<LoginPwdless> = (values) => {
        const data: LoginActionPayload = {
            type: 'request-login',
            email: values.email,
            returnUrl: window?.location?.href,
        };
        return login(data);
    };

    useEffect(() => {
        const hash = params.get('hash');
        if (hash && hash.length >= SEEM_SAFE_HASH_LENGTH) {
            login({ type: 'login', hash, redirect: true, to: '/' });
        } else if (hash) {
            const cloneParams = new URLSearchParams(params);
            cloneParams.delete('hash');
            return router.replace(`/dang-nhap?${cloneParams.toString()}`);
        }
    }, [params, router, login, open]);

    useEffect(() => {
        if (params.get('error') === 'failed_to_login') {
            open({
                type: 'error',
                message: 'Failed to login, please try again.',
                key: 'failed_to_login',
            });
        }
    }, [params, open]);

    if (params.get('hash')) {
        return <Loading />;
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
                    Tiếp tục vào VePhim
                </Title>
                <Text>Sử dụng email của bạn</Text>

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
                        content="Tiếp tục"
                        type="primary"
                        style={{ width: '240px' }}
                        size="middle"
                        htmlType="submit"
                        isValid={isValid}
                    />
                </form>
                <Divider plain>hoặc với</Divider>
                <Space direction="horizontal" align="center">
                    <LoadingBtn
                        type="primary"
                        style={{ width: '100px' }}
                        size="middle"
                        isValid={isValid}
                        onClick={() =>
                            signIn('google', {
                                callbackUrl: window?.location?.href ?? '',
                                redirect: false,
                            })
                        }
                    >
                        <GoogleOutlined /> Google
                    </LoadingBtn>
                    <LoadingBtn
                        type="primary"
                        style={{ width: '100px' }}
                        size="middle"
                        isValid={isValid}
                        onClick={() =>
                            signIn('github', {
                                callbackUrl: window?.location?.href ?? '',
                                redirect: false,
                            })
                        }
                    >
                        <GithubOutlined /> Github
                    </LoadingBtn>
                </Space>
                <Divider plain></Divider>
                <Text type="secondary">
                    Bằng cách bấm tiếp tục, bạn đồng ý với <Link href="#">Điều Khoản</Link> của
                    chúng tôi
                </Text>
            </Space>
        </div>
    );
}
