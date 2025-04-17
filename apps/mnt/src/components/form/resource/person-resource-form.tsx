import { Form, Image, Input, Space, Button, Upload, message } from 'antd';
import { UploadOutlined, UndoOutlined } from '@ant-design/icons';
import { BaseResourceForm, BaseResourceFormProps } from './base-resource-form';
import { useEffect, useState } from 'react';
import type { FormProps } from 'antd';
import { useApiUrl } from '@refinedev/core';
import { useAxiosAuth } from '@/hooks/useAxiosAuth';

interface PersonResourceFormProps extends BaseResourceFormProps {
    formProps: FormProps;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const PersonResourceForm: React.FC<PersonResourceFormProps> = ({
    formProps,
    type,
    gqlQuery,
    operation,
}) => {
    const apiUrl = useApiUrl();
    const axios = useAxiosAuth();
    const [imageUrl, setImageUrl] = useState<string>('');
    const [defaultImageUrl, setDefaultImageUrl] = useState<string>('');
    const [isImageLoading, setIsImageLoading] = useState(false);

    useEffect(() => {
        const initialImageUrl = formProps.initialValues?.posterUrl || '';
        setImageUrl(initialImageUrl);
        setDefaultImageUrl(initialImageUrl);
    }, [formProps.initialValues]);

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageUrl(e.target.value);
        formProps.form?.setFieldsValue({
            posterUrl: e.target.value,
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customUpload = async (options: any) => {
        const { onSuccess, onError, file } = options;
        setIsImageLoading(true);

        const formData = new FormData();
        formData.append('images', file);

        try {
            const response = await axios.post(`${apiUrl}/images`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data[0] && response.data[0].url) {
                onSuccess(response, file);
                const newUrl = response.data[0].url;
                formProps.form?.setFieldsValue({
                    posterUrl: newUrl,
                });
                setImageUrl(newUrl);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            onError({ error });
            message.error('Tải ảnh thất bại, vui lòng thử lại sau!');
        } finally {
            setIsImageLoading(false);
        }
    };

    const beforeUpload = (file: File) => {
        const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type);
        if (!isAllowedType) {
            message.error('Định dạng ảnh không hợp lệ (JPG/PNG/GIF/WebP)');
        }
        const isLessThan10MB = file.size <= MAX_FILE_SIZE;
        if (!isLessThan10MB) {
            message.error('Kích thước ảnh quá lớn (tối đa 10MB)');
        }
        return isAllowedType && isLessThan10MB;
    };

    const restoreDefaultImage = () => {
        setImageUrl(defaultImageUrl);
        formProps.form?.setFieldsValue({
            posterUrl: defaultImageUrl,
        });
    };

    return (
        <BaseResourceForm
            type={type}
            formProps={formProps}
            gqlQuery={gqlQuery}
            operation={operation}
            sourceField="name"
            slugField="slug"
        >
            <Form.Item
                name="originalName"
                label="Tên gốc"
                rules={[{ required: true, message: 'Vui lòng nhập tên gốc' }]}
                tooltip="Tên bằng ngôn ngữ bản địa"
            >
                <Input />
            </Form.Item>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Form.Item
                    name="posterUrl"
                    label="URL hình ảnh"
                    tooltip="Nhập URL hình ảnh của người này"
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Input
                            value={imageUrl}
                            onChange={handleImageUrlChange}
                            placeholder="https://example.com/image.jpg"
                        />
                        <Space>
                            <Upload
                                customRequest={customUpload}
                                showUploadList={false}
                                beforeUpload={beforeUpload}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />} loading={isImageLoading}>
                                    Tải lên
                                </Button>
                            </Upload>
                            {imageUrl !== defaultImageUrl && (
                                <Button icon={<UndoOutlined />} onClick={restoreDefaultImage}>
                                    Khôi phục
                                </Button>
                            )}
                        </Space>
                    </Space>
                </Form.Item>

                {imageUrl && (
                    <div style={{ marginBottom: 24 }}>
                        <Image
                            src={imageUrl}
                            alt="Xem trước"
                            style={{
                                maxWidth: '200px',
                                maxHeight: '300px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            }}
                            onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                            }}
                            onLoad={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'block';
                            }}
                        />
                    </div>
                )}
            </Space>
        </BaseResourceForm>
    );
};
