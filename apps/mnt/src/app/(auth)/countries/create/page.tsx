'use client';

import { Create, useForm } from '@refinedev/antd';
import { type RegionType } from '~api/app/regions/region.type';
import { ResourceForm } from '~mnt/components/form/resource/resource-form';
import { MNT_REGION_QUERY, MNT_REGION_CREATE } from '~mnt/queries/region.query';

export default function CreateRegion() {
    const { formProps, saveButtonProps } = useForm<RegionType>({
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

    return (
        <Create saveButtonProps={saveButtonProps}>
            <ResourceForm
                formProps={formProps}
                gqlQuery={MNT_REGION_QUERY}
                resource="countries"
                singularName="country"
                type="create"
                operation="region"
            />
        </Create>
    );
}
