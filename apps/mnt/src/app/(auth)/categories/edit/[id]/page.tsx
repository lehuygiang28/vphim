'use client';

import { Edit, useForm } from '@refinedev/antd';
import { type CategoryType } from '~api/app/categories/category.type';
import { CategoryForm } from '~mnt/components/form/category/category-form';
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
        <Edit saveButtonProps={saveButtonProps}>
            <CategoryForm formProps={formProps} type="edit" />
        </Edit>
    );
}
