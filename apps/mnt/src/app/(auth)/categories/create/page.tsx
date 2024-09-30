'use client';

import { Create, useForm } from '@refinedev/antd';
import { type CategoryType } from '~api/app/categories/category.type';
import { CategoryForm } from '~mnt/components/form/category/category-form';
import { MNT_CATEGORY_CREATE } from '~mnt/queries/category.query';

export default function CreateCategory() {
    const { formProps, saveButtonProps } = useForm<CategoryType>({
        dataProviderName: 'graphql',
        action: 'create',
        resource: 'categories',
        redirect: 'show',
        id: '',
        meta: {
            gqlMutation: MNT_CATEGORY_CREATE,
            operation: 'createCategory',
        },
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <CategoryForm formProps={formProps} type="create" />
        </Create>
    );
}
