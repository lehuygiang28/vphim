'use client';

import React from 'react';
import { MNT_REGIONS_LIST_QUERY, MNT_REGION_DELETE } from '~mnt/queries/region.query';
import { SimpleResourceList } from '~mnt/components/list/simple-resource-list';

export default function RegionList() {
    return (
        <SimpleResourceList
            title="Danh sách quốc gia"
            createPath="/countries/create"
            deleteOperation="deleteRegion"
            gqlQuery={MNT_REGIONS_LIST_QUERY}
            gqlDeleteMutation={MNT_REGION_DELETE}
            resource="countries"
            operation="regions"
        />
    );
}
