'use client';

import { Create, useForm } from '@refinedev/antd';
import { type ActorType } from '~api/app/actors/actor.type';
import { PersonResourceForm } from '~mnt/components/form/resource/person-resource-form';
import { useFormLocalStorage } from '~mnt/hooks/useFormLocalStorage';
import { MNT_ACTOR_QUERY, MNT_ACTOR_CREATE } from '~mnt/queries/actor.query';

const STORAGE_KEY = 'vephim_actorCreateFormData';

export default function CreateActor() {
    const { formProps, saveButtonProps, form, onFinish } = useForm<ActorType>({
        dataProviderName: 'graphql',
        action: 'create',
        resource: 'actors',
        redirect: 'show',
        id: '',
        meta: {
            gqlMutation: MNT_ACTOR_CREATE,
            operation: 'createActor',
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
                gqlQuery={MNT_ACTOR_QUERY}
                type="create"
                operation="actor"
            />
        </Create>
    );
}
