'use client';

import { Create, useForm } from '@refinedev/antd';
import { type DirectorType } from '~api/app/directors/director.type';
import { ResourceForm } from '~mnt/components/form/resource/resource-form';
import { MNT_DIRECTOR_QUERY, MNT_DIRECTOR_CREATE } from '~mnt/queries/director.query';

export default function CreateRegion() {
    const { formProps, saveButtonProps } = useForm<DirectorType>({
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

    return (
        <Create saveButtonProps={saveButtonProps}>
            <ResourceForm
                formProps={formProps}
                gqlQuery={MNT_DIRECTOR_QUERY}
                resource="countries"
                singularName="country"
                type="create"
                operation="region"
            />
        </Create>
    );
}
