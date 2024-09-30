'use client';

import { Edit, useForm } from '@refinedev/antd';
import { type ActorType } from '~api/app/actors/actor.type';
import { ResourceForm } from '~mnt/components/form/resource/resource-form';
import { MNT_ACTOR_QUERY, MNT_ACTOR_UPDATE } from '~mnt/queries/actor.query';

export type EditActorPageProps = {
    params: { id: string };
};

export default function EditActor({ params }: EditActorPageProps) {
    const { formProps, saveButtonProps } = useForm<ActorType>({
        dataProviderName: 'graphql',
        resource: 'actors',
        action: 'edit',
        meta: {
            gqlQuery: MNT_ACTOR_QUERY,
            gqlMutation: MNT_ACTOR_UPDATE,
            operation: 'actor',
            variables: {
                input: {
                    _id: params.id,
                },
            },
        },
    });

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <ResourceForm
                formProps={formProps}
                gqlQuery={MNT_ACTOR_QUERY}
                resource="actors',"
                singularName="country"
                type="edit"
                operation="actor"
            />
        </Edit>
    );
}