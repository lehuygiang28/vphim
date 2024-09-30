'use client';

import { Create, useForm } from '@refinedev/antd';
import { type ActorType } from '~api/app/actors/actor.type';
import { ResourceForm } from '~mnt/components/form/resource/resource-form';
import { MNT_ACTOR_QUERY, MNT_ACTOR_CREATE } from '~mnt/queries/actor.query';

export default function CreateRegion() {
    const { formProps, saveButtonProps } = useForm<ActorType>({
        dataProviderName: 'graphql',
        action: 'create',
        resource: 'regions',
        redirect: 'show',
        id: '',
        meta: {
            gqlMutation: MNT_ACTOR_CREATE,
            operation: 'createRegion',
        },
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <ResourceForm
                formProps={formProps}
                gqlQuery={MNT_ACTOR_QUERY}
                resource="countries"
                singularName="country"
                type="create"
                operation="region"
            />
        </Create>
    );
}
