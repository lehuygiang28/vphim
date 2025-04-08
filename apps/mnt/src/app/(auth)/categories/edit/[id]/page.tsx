'use client';

import { Edit, useForm } from '@refinedev/antd';
import { type CategoryType } from '~api/app/categories/category.type';
import { BaseResourceForm } from '~mnt/components/form/resource/base-resource-form';
import { MNT_CATEGORY_QUERY, MNT_CATEGORY_UPDATE } from '~mnt/queries/category.query';

export type EditCategoryPageProps = {
    params: { id: string };
};

export default function EditCategory({ params }: EditCategoryPageProps) {
    const { formProps, saveButtonProps } = useForm<CategoryType>({
        dataProviderName: 'graphql',
        resource: 'categories',
        action: 'edit',
        meta: {
            gqlQuery: MNT_CATEGORY_QUERY,
            gqlMutation: MNT_CATEGORY_UPDATE,
            operation: 'category',
            variables: {
                input: {
                    _id: params.id,
                },
            },
        },
    });

    return (
        <Edit
            title={`Chỉnh sửa thể loại "${formProps.initialValues?.name}"`}
            saveButtonProps={saveButtonProps}
        >
            <BaseResourceForm
                formProps={formProps}
                type="edit"
                gqlQuery={MNT_CATEGORY_QUERY}
                operation="category"
            />
        </Edit>
    );
}
