import { Form, Image, Input, Space } from 'antd';
import { BaseResourceForm, BaseResourceFormProps } from './base-resource-form';
import { useEffect, useState } from 'react';
import type { FormProps } from 'antd';

interface PersonResourceFormProps extends BaseResourceFormProps {
    formProps: FormProps;
}

export const PersonResourceForm: React.FC<PersonResourceFormProps> = ({
    formProps,
    type,
    gqlQuery,
    operation,
}) => {
    const [imageUrl, setImageUrl] = useState<string>('');

    useEffect(() => {
        setImageUrl(formProps.initialValues?.posterUrl || '');
    }, [formProps.initialValues]);

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageUrl(e.target.value);
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
                    <Input
                        onChange={handleImageUrlChange}
                        placeholder="https://example.com/image.jpg"
                    />
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
