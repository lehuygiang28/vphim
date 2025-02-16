'use client';

import { Create, useForm } from '@refinedev/antd';
import { type DirectorType } from '~api/app/directors/director.type';
import { PersonResourceForm } from '~mnt/components/form/resource/person-resource-form';
import { useFormLocalStorage } from '~mnt/hooks/useFormLocalStorage';
import { MNT_DIRECTOR_QUERY, MNT_DIRECTOR_CREATE } from '~mnt/queries/director.query';

const STORAGE_KEY = 'vephim_directorCreateFormData';

export default function CreateRegion() {
    const { formProps, saveButtonProps, form, onFinish } = useForm<DirectorType>({
        dataProviderName: 'graphql',
        action: 'create',
        resource: 'directors',
        redirect: 'show',
        id: '',
        meta: {
            gqlMutation: MNT_DIRECTOR_CREATE,
            operation: 'createDirector',
        },
    });

    const { ClearFormButton, handleValuesChange, handleFormFinish } = useFormLocalStorage({
        form,
        storageKey: STORAGE_KEY,
        onFinish,
    });

    return (
        <Create saveButtonProps={saveButtonProps} headerButtons={<ClearFormButton />}>
            <PersonResourceForm
                formProps={{
                    ...formProps,
                    onFinish: handleFormFinish,
                    onValuesChange: handleValuesChange,
                }}
                gqlQuery={MNT_DIRECTOR_QUERY}
                type="create"
                operation="director"
            />
        </Create>
    );
}
