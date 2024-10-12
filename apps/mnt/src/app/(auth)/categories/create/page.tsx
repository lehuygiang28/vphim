'use client';

import { Create, useForm } from '@refinedev/antd';
import { type CategoryType } from '~api/app/categories/category.type';
import { CategoryForm } from '~mnt/components/form/category/category-form';
import { useFormLocalStorage } from '~mnt/hooks/useFormLocalStorage';
import { MNT_CATEGORY_CREATE } from '~mnt/queries/category.query';

const STORAGE_KEY = 'vephim_categoryCreateFormData';

export default function CreateCategory() {
    const { formProps, saveButtonProps, form, onFinish } = useForm<CategoryType>({
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

    const { ClearFormButton, handleValuesChange, handleFormFinish } = useFormLocalStorage({
        form,
        storageKey: STORAGE_KEY,
        onFinish,
    });

    return (
        <Create saveButtonProps={saveButtonProps} headerButtons={<ClearFormButton />}>
            <CategoryForm
                formProps={{
                    ...formProps,
                    onFinish: handleFormFinish,
                    onValuesChange: handleValuesChange,
                }}
                type="create"
            />
        </Create>
    );
}
