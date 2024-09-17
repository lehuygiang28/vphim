import { UploadOutlined, UndoOutlined } from '@ant-design/icons';
import { Button, Card, Form, FormProps, Input, Upload, Image, message, Space } from 'antd';
import { useState, useEffect } from 'react';
import { useApiUrl } from '@refinedev/core';
import { useAxiosAuth } from '@/hooks/useAxiosAuth';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type MediaTabProps = {
    formProps: FormProps<unknown>;
};

export function MediaTab({ formProps }: MediaTabProps) {
    const apiUrl = useApiUrl();
    const axios = useAxiosAuth();

    const [isPostLoading, setIsPostLoading] = useState(false);
    const [isThumbLoading, setIsThumbLoading] = useState(false);
    const [posterUrl, setPosterUrl] = useState('');
    const [thumbUrl, setThumbUrl] = useState('');
    const [defaultPosterUrl, setDefaultPosterUrl] = useState('');
    const [defaultThumbUrl, setDefaultThumbUrl] = useState('');

    useEffect(() => {
        const initialPosterUrl = formProps.form?.getFieldValue('posterUrl') || '';
        const initialThumbUrl = formProps.form?.getFieldValue('thumbUrl') || '';
        setPosterUrl(initialPosterUrl);
        setThumbUrl(initialThumbUrl);
        setDefaultPosterUrl(initialPosterUrl);
        setDefaultThumbUrl(initialThumbUrl);
    }, [formProps.form]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customUpload = async (options: any, type: 'poster' | 'thumb') => {
        const { onSuccess, onError, file } = options;
        setIsPostLoading(type === 'poster');
        setIsThumbLoading(type === 'thumb');

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
                    [type === 'poster' ? 'posterUrl' : 'thumbUrl']: newUrl,
                });
                if (type === 'poster') {
                    setPosterUrl(newUrl);
                } else {
                    setThumbUrl(newUrl);
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            onError({ error });
            message.error('Image upload failed, please try again later!');
        } finally {
            setIsPostLoading(false);
            setIsThumbLoading(false);
        }
    };

    const beforeUpload = (file: File) => {
        const isAllowedType = ALLOWED_FILE_TYPES.includes(file.type);
        if (!isAllowedType) {
            message.error('Invalid image format (JPG/PNG/GIF/WebP)');
        }
        const isLessThan10MB = file.size <= MAX_FILE_SIZE;
        if (!isLessThan10MB) {
            message.error('Image size is too large (max 10MB)');
        }
        return isAllowedType && isLessThan10MB;
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'poster' | 'thumb') => {
        const newUrl = e.target.value;
        if (type === 'poster') {
            setPosterUrl(newUrl);
        } else {
            setThumbUrl(newUrl);
        }
        formProps.form?.setFieldsValue({
            [type === 'poster' ? 'posterUrl' : 'thumbUrl']: newUrl,
        });
    };

    const restoreDefaultImage = (type: 'poster' | 'thumb') => {
        const defaultUrl = type === 'poster' ? defaultPosterUrl : defaultThumbUrl;
        if (type === 'poster') {
            setPosterUrl(defaultUrl);
        } else {
            setThumbUrl(defaultUrl);
        }
        formProps.form?.setFieldsValue({
            [type === 'poster' ? 'posterUrl' : 'thumbUrl']: defaultUrl,
        });
    };

    return (
        <Card title="Media" bordered={false}>
            <Form.Item label="Poster URL" name="posterUrl">
                <Input onChange={(e) => handleUrlChange(e, 'poster')} />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Upload
                        customRequest={(options) => customUpload(options, 'poster')}
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />} loading={isPostLoading}>
                            Upload Poster
                        </Button>
                    </Upload>
                    {posterUrl !== defaultPosterUrl && (
                        <Button
                            icon={<UndoOutlined />}
                            onClick={() => restoreDefaultImage('poster')}
                        >
                            Restore Default
                        </Button>
                    )}
                </Space>
            </Form.Item>
            <Form.Item label="Poster Preview">
                {posterUrl && <Image src={posterUrl} alt="Movie Poster" />}
            </Form.Item>
            <Form.Item label="Thumb URL" name="thumbUrl">
                <Input onChange={(e) => handleUrlChange(e, 'thumb')} />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Upload
                        customRequest={(options) => customUpload(options, 'thumb')}
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />} loading={isThumbLoading}>
                            Upload Thumb
                        </Button>
                    </Upload>
                    {thumbUrl !== defaultThumbUrl && (
                        <Button
                            icon={<UndoOutlined />}
                            onClick={() => restoreDefaultImage('thumb')}
                        >
                            Restore Default
                        </Button>
                    )}
                </Space>
            </Form.Item>
            <Form.Item label="Thumb Preview">
                {thumbUrl && <Image src={thumbUrl} alt="Movie Thumb" />}
            </Form.Item>
        </Card>
    );
}
