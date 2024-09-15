'use client';

import { useEffect, useState } from 'react';
import { useGetIdentity, useNotification, useApiUrl, useUpdate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { Controller } from 'react-hook-form';
import { Form, Input, Upload, Button, Avatar, Typography, Space, Grid, Skeleton } from 'antd';
import { UserOutlined, MailOutlined, UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { LoginResponseDto } from 'apps/api/src/app/auth/dtos';
import { useSession } from 'next-auth/react';
import { GET_ME_QUERY, MUTATION_ME_QUERY } from '@/queries/users';
import Loading from '@/app/loading';
import Link from 'next/link';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export type UserUpdateComponentProps = {
    onBack?: () => void;
};

export function UserUpdateComponent({ onBack }: UserUpdateComponentProps) {
    const { md } = useBreakpoint();
    const apiUrl = useApiUrl();
    const { data: user } = useGetIdentity<LoginResponseDto>();
    const { open } = useNotification();
    const { data: session, status } = useSession();
    const { mutate: update } = useUpdate();
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);

    const {
        refineCore: { formLoading },
        control,
        handleSubmit,
        formState: { errors, isValid },
        setValue,
        watch,
    } = useForm({
        refineCoreProps: {
            dataProviderName: 'graphql',
            resource: 'users',
            meta: {
                gqlQuery: GET_ME_QUERY,
                operation: 'getMe',
            },
            action: 'edit',
            id: user?._id?.toString(),
            redirect: false,
            onMutationSuccess: () => {
                open({
                    type: 'success',
                    message: 'Profile updated successfully',
                });
            },
            onMutationError: () => {
                open({
                    type: 'error',
                    message: 'Failed to update profile',
                });
            },
        },
        defaultValues: {
            fullName: user?.fullName || '',
            avatar: {
                url: user?.avatar?.url || '',
            },
        },
    });

    useEffect(() => {
        if (user) {
            setValue('fullName', user.fullName || '');
            setValue('avatar.url', user?.avatar?.url || '');
        }
    }, [user, setValue]);

    const imageUrl = watch('avatar.url');

    const onSubmit = async (values: any) => {
        return update({
            resource: 'users',
            id: user?._id?.toString(),
            values,
            mutationMode: 'optimistic',
            dataProviderName: 'graphql',
            meta: {
                gqlMutation: MUTATION_ME_QUERY,
                operation: 'mutationMe',
                variables: {
                    input: values,
                },
            },
        });
    };

    if (status === 'loading') {
        return <Loading />;
    }

    return (
        <div style={{ width: md ? '25vw' : '90vw' }}>
            <Space align="start">
                <Link href={'/'} style={{ all: 'unset' }} onClick={onBack}>
                    <Button type="text">
                        <ArrowLeftOutlined />
                    </Button>
                </Link>
            </Space>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                    <Title level={3} style={{ marginBottom: '4px' }}>
                        Cập nhật thông tin
                    </Title>
                    <Text>Thay đổi thông tin của bạn</Text>
                </div>

                <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
                    <Form.Item label="Ảnh đại diện" style={{ textAlign: 'center' }}>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                {isAvatarLoading ? (
                                    <Skeleton.Avatar size={100} active />
                                ) : (
                                    <Avatar size={100} src={imageUrl} icon={<UserOutlined />} />
                                )}
                            </div>
                            <Controller
                                control={control}
                                name="avatar.url"
                                render={({ field }) => (
                                    <Upload
                                        action={`${apiUrl}/images`}
                                        headers={{
                                            Authorization: `Bearer ${session?.user?.accessToken}`,
                                        }}
                                        name="images"
                                        showUploadList={false}
                                        beforeUpload={() => {
                                            setIsAvatarLoading(true);
                                            return true;
                                        }}
                                        onChange={(info) => {
                                            if (info.file.status === 'done') {
                                                setIsAvatarLoading(false);
                                                field.onChange(info.file.response[0].url);
                                            }
                                        }}
                                    >
                                        <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                                    </Upload>
                                )}
                            />
                        </Space>
                    </Form.Item>

                    <Form.Item
                        label="Tên"
                        validateStatus={errors?.fullName ? 'error' : 'validating'}
                        help={errors?.fullName?.message}
                    >
                        <Controller
                            control={control}
                            name="fullName"
                            rules={{ required: 'Tên không được để trống' }}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    placeholder="Tên hiển thị"
                                />
                            )}
                        />
                    </Form.Item>

                    <Form.Item label="Email">
                        <Input
                            prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="Email"
                            value={user?.email}
                            disabled
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            style={{ width: '100%' }}
                            size="large"
                            htmlType="submit"
                            loading={formLoading}
                            disabled={formLoading}
                        >
                            Lưu thay đổi
                        </Button>
                    </Form.Item>
                </Form>
            </Space>
        </div>
    );
}
