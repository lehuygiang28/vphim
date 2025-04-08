import { Form, Input, FormProps } from 'antd';
import { useAutoSlug, UseAutoSlugProps } from '~mnt/hooks/useAutoSlug';
import { SlugFormItem } from '~mnt/components/slug-form-item';

export interface BaseResourceFormProps extends UseAutoSlugProps {
    formProps: FormProps;
    type: 'create' | 'edit';
    children?: React.ReactNode;
}

export const BaseResourceForm: React.FC<BaseResourceFormProps> = ({
    type,
    formProps,
    gqlQuery,
    operation,
    slugField = 'slug',
    sourceField = 'name',
    children,
}) => {
    const {
        handleFormSubmit,
        handleSourceFieldChange,
        autoSlug,
        toggleAutoSlug,
        slugExists,
        handleSlugChange,
        isCheckingSlugLoading,
        slug,
    } = useAutoSlug({
        formProps,
        type,
        gqlQuery,
        operation,
        slugField,
        sourceField,
    });

    const title = type === 'create' ? 'Tạo mới' : 'Chỉnh sửa';

    return (
        <Form title={title} {...formProps} layout="vertical" onFinish={handleFormSubmit}>
            <Form.Item
                name={sourceField}
                label={
                    sourceField === 'name'
                        ? 'Tên'
                        : sourceField.charAt(0).toUpperCase() + sourceField.slice(1)
                }
                rules={[
                    {
                        required: true,
                        message: `Vui lòng nhập ${sourceField === 'name' ? 'tên' : sourceField}`,
                    },
                ]}
            >
                <Input onChange={handleSourceFieldChange} />
            </Form.Item>

            <SlugFormItem
                name="slug"
                disabled={type === 'edit'}
                autoSlug={autoSlug}
                onToggleAutoSlug={toggleAutoSlug}
                onChange={handleSlugChange}
                isCheckingSlug={isCheckingSlugLoading}
                slugExists={slugExists}
                value={slug}
            />

            {children}
        </Form>
    );
};
