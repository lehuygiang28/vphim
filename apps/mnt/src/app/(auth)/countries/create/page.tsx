'use client';

import { Create, useForm } from '@refinedev/antd';
import { type RegionType } from '~api/app/regions/region.type';
import { BaseResourceForm } from '~mnt/components/form/resource/base-resource-form';
import { useFormLocalStorage } from '~mnt/hooks/useFormLocalStorage';
import { MNT_REGION_QUERY, MNT_REGION_CREATE } from '~mnt/queries/region.query';

const STORAGE_KEY = 'vephim_regionCreateFormData';

export default function CreateRegion() {
    const { formProps, saveButtonProps, form, onFinish } = useForm<RegionType>({
        dataProviderName: 'graphql',
        action: 'create',
        resource: 'regions',
        redirect: 'show',
        id: '',
        meta: {
            gqlMutation: MNT_REGION_CREATE,
            operation: 'createRegion',
        },
    });

    const { ClearFormButton, handleValuesChange, handleFormFinish } = useFormLocalStorage({
        form,
        storageKey: STORAGE_KEY,
        onFinish,
    });

    return (
        <Create saveButtonProps={saveButtonProps} headerButtons={<ClearFormButton />}>
            <BaseResourceForm
                formProps={{
                    ...formProps,
                    onFinish: handleFormFinish,
                    onValuesChange: handleValuesChange,
                }}
                type="create"
                gqlQuery={MNT_REGION_QUERY}
                operation="region"
            />
        </Create>
    );
}
