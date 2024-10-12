'use client';

import { Create, useForm } from '@refinedev/antd';
import { type DirectorType } from '~api/app/directors/director.type';
import { ResourceForm } from '~mnt/components/form/resource/resource-form';
import { useFormLocalStorage } from '~mnt/hooks/useFormLocalStorage';
import { MNT_DIRECTOR_QUERY, MNT_DIRECTOR_CREATE } from '~mnt/queries/director.query';

const STORAGE_KEY = 'vephim_directorCreateFormData';

export default function CreateRegion() {
    const { formProps, saveButtonProps, form, onFinish } = useForm<DirectorType>({
        dataProviderName: 'graphql',
        action: 'create',
        resource: 'regions',
        redirect: 'show',
        id: '',
        meta: {
            gqlMutation: MNT_DIRECTOR_CREATE,
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
            <ResourceForm
                formProps={{
                    ...formProps,
                    onFinish: handleFormFinish,
                    onValuesChange: handleValuesChange,
                }}
                gqlQuery={MNT_DIRECTOR_QUERY}
                resource="countries"
                singularName="country"
                type="create"
                operation="region"
            />
        </Create>
    );
}
