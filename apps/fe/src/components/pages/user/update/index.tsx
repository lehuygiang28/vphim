'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGetIdentity, useNotification, useApiUrl, useUpdate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { Controller } from 'react-hook-form';
import { Form, Input, Upload, Button, Avatar, Typography, Space, Skeleton, message } from 'antd';
import { UserOutlined, MailOutlined, UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';

import type { LoginResponseDto } from 'apps/api/src/app/auth/dtos';

import { GET_ME_QUERY, MUTATION_ME_QUERY } from '@/queries/users';
import { useAxiosAuth } from '@/hooks/useAxiosAuth';

const { Title, Text } = Typography;

export type UserUpdateComponentProps = {
    onBack?: () => void;
    language?: 'en' | 'vi';
};

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const translations = {
    en: {
        updateInfo: 'Update Information',
        changeInfo: 'Change your information',
        avatar: 'Avatar',
        chooseImage: 'Choose Image',
        name: 'Name',
        nameRequired: 'Name is required',
        displayName: 'Display Name',
        email: 'Email',
        saveChanges: 'Save Changes',
        profileUpdated: 'Profile updated successfully',
        uploadFailed: 'Image upload failed, please try again later!',
        updateFailed: 'Failed to update information, please try again later!',
        updateSuccess: 'Information updated successfully!',
        invalidFormat: 'Invalid image format (JPG/PNG/GIF/WebP)',
        fileTooLarge: 'Image size is too large (max 10MB)',
    },
    vi: {
        updateInfo: 'Cập nhật thông tin',
        changeInfo: 'Thay đổi thông tin của bạn',
        avatar: 'Ảnh đại diện',
        chooseImage: 'Chọn ảnh',
        name: 'Tên',
        nameRequired: 'Tên không được để trống',
        displayName: 'Tên hiển thị',
        email: 'Email',
        saveChanges: 'Lưu thay đổi',
        profileUpdated: 'Cập nhật thông tin thành công',
        uploadFailed: 'Tải ảnh thất bại, vui lòng thử lại sau!',
        updateFailed: 'Cập nhật thông tin thất bạn, vui lòng thử lại sau!',
        updateSuccess: 'Cập nhật thông tin thành công!',
        invalidFormat: 'Định dạng ảnh chưa hợp lệ (JPG/PNG/GIF/WebP)',
        fileTooLarge: 'Kích thước ảnh quá lớn (tối đa 10MB)',
    },
};

export function UserUpdateComponent({ onBack, language = 'vi' }: UserUpdateComponentProps) {
    const t = translations[language];
    const apiUrl = useApiUrl('graphql');
    const { data: user } = useGetIdentity<LoginResponseDto>();
    const { open } = useNotification();
    const { mutate: update } = useUpdate();
    const [isAvatarLoading, setIsAvatarLoading] = useState(false);
    const queryClient = useQueryClient();
    const axios = useAxiosAuth();

    const {
        refineCore: { formLoading },
        control,
        handleSubmit,
        formState: { errors },
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
                    message: t.profileUpdated,
                });
            },
            onMutationError: () => {
                open({
                    type: 'error',
                    message: t.updateFailed,
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

    const customUpload = async (options: any) => {
        const { onSuccess, onError, file } = options;
        setIsAvatarLoading(true);

        const formData = new FormData();
        formData.append('images', file);

        try {
            const response = await axios.post(`${apiUrl}/api/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data[0] && response.data[0].url) {
                onSuccess(response, file);
                setValue('avatar.url', response.data[0].url);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            onError({ error });
            message.error(t.uploadFailed);
        } finally {
            setIsAvatarLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setValue('fullName', user.fullName || '');
            setValue('avatar.url', user?.avatar?.url || '');
        }
    }, [user, setValue]);

    const imageUrl = watch('avatar.url');

    const onSubmit = async (values: unknown) => {
        update({
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
            errorNotification: {
                type: 'error',
                message: t.updateFailed,
            },
            successNotification: {
                type: 'success',
                message: t.updateSuccess,
            },
        });
        queryClient.invalidateQueries({ queryKey: ['auth', 'identity'] });
    };

    const beforeUpload = (file: File) => {
        const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type);
        if (!isAllowedType) {
            message.error(t.invalidFormat);
        }
        const isLessThan10MB = file.size <= MAX_FILE_SIZE;
        if (!isLessThan10MB) {
            message.error(t.fileTooLarge);
        }
        return isAllowedType && isLessThan10MB;
    };

    return (
        <div>
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
                        {t.updateInfo}
                    </Title>
                    <Text>{t.changeInfo}</Text>
                </div>

                <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
                    <Form.Item label={t.avatar} style={{ textAlign: 'center' }}>
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
                                        customRequest={customUpload}
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                            const canUpload = beforeUpload(file);
                                            if (canUpload) {
                                                setIsAvatarLoading(true);
                                            }
                                            return canUpload || Upload.LIST_IGNORE;
                                        }}
                                        accept={ALLOWED_FILE_TYPES.join(',')}
                                    >
                                        <Button icon={<UploadOutlined />}>{t.chooseImage}</Button>
                                    </Upload>
                                )}
                            />
                        </Space>
                    </Form.Item>

                    <Form.Item
                        label={t.name}
                        validateStatus={errors?.fullName ? 'error' : 'validating'}
                        help={errors?.fullName?.message}
                    >
                        <Controller
                            control={control}
                            name="fullName"
                            rules={{ required: t.nameRequired }}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    placeholder={t.displayName}
                                />
                            )}
                        />
                    </Form.Item>

                    <Form.Item label={t.email}>
                        <Input
                            prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder={t.email}
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
                            {t.saveChanges}
                        </Button>
                    </Form.Item>
                </Form>
            </Space>
        </div>
    );
}
