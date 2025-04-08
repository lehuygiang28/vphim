import { Form, Input, Tooltip } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

interface SlugFormItemProps {
    name: string;
    disabled?: boolean;
    autoSlug?: boolean;
    onToggleAutoSlug?: () => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isCheckingSlug?: boolean;
    slugExists?: boolean;
    value?: string;
}

export const SlugFormItem: React.FC<SlugFormItemProps> = ({
    name,
    disabled,
    autoSlug,
    onToggleAutoSlug,
    onChange,
    isCheckingSlug,
    slugExists,
    value,
}) => {
    return (
        <Form.Item
            name={name}
            label={
                <span>
                    Slug
                    {!disabled && (
                        <Tooltip title={autoSlug ? 'Tắt tự tạo slug' : 'Bật tự tạo slug'}>
                            <LinkOutlined
                                style={{
                                    marginLeft: '8px',
                                    cursor: 'pointer',
                                    color: autoSlug ? '#1890ff' : '#d9d9d9',
                                }}
                                onClick={onToggleAutoSlug}
                            />
                        </Tooltip>
                    )}
                </span>
            }
            help={
                isCheckingSlug
                    ? 'Đang kiểm tra slug...'
                    : slugExists
                    ? 'Slug này đã tồn tại'
                    : value
                    ? 'Slug khả dụng'
                    : ''
            }
            validateStatus={
                isCheckingSlug ? 'validating' : slugExists ? 'error' : value ? 'success' : undefined
            }
            rules={[
                { required: true, message: 'Vui lòng nhập slug' },
                {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: 'Định dạng slug không hợp lệ',
                },
            ]}
        >
            <Input disabled={disabled || autoSlug} onChange={onChange} placeholder="slug-cua-ban" />
        </Form.Item>
    );
};
