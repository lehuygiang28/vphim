'use client';

import { Edit, useForm } from '@refinedev/antd';
import { type RegionType } from '~api/app/regions/region.type';
import { ResourceForm } from '~mnt/components/form/resource/resource-form';
import { MNT_REGION_QUERY, MNT_REGION_UPDATE } from '~mnt/queries/region.query';

export type EditRegionPageProps = {
    params: { id: string };
};

export default function EditRegion({ params }: EditRegionPageProps) {
    const { formProps, saveButtonProps } = useForm<RegionType>({
        dataProviderName: 'graphql',
        resource: 'countries',
        action: 'edit',
        meta: {
            gqlQuery: MNT_REGION_QUERY,
            gqlMutation: MNT_REGION_UPDATE,
            operation: 'region',
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
                gqlQuery={MNT_REGION_QUERY}
                resource="countries"
                singularName="country"
                type="edit"
                operation="region"
            />
        </Edit>
    );
}
