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
                        <Tooltip title={autoSlug ? 'Disable auto-slug' : 'Enable auto-slug'}>
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
                    ? 'Checking slug availability...'
                    : slugExists
                    ? 'This slug already exists'
                    : value
                    ? 'Slug is available'
                    : ''
            }
            validateStatus={
                isCheckingSlug ? 'validating' : slugExists ? 'error' : value ? 'success' : undefined
            }
            rules={[
                { required: true, message: 'Please enter slug' },
                {
                    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    message: 'Invalid slug format',
                },
            ]}
        >
            <Input disabled={disabled || autoSlug} onChange={onChange} placeholder="your-slug" />
        </Form.Item>
    );
};
