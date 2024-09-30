'use client';

import React from 'react';
import { GET_DIRECTOR_LIST_QUERY, MNT_DIRECTOR_DELETE } from '~mnt/queries/director.query';
import ResourceList from '~mnt/components/list/resource-list';

export default function DirectorList() {
    return (
        <ResourceList
            createPath="/directors/create"
            deleteOperation="deleteDirector"
            gqlQuery={GET_DIRECTOR_LIST_QUERY}
            gqlDeleteMutation={MNT_DIRECTOR_DELETE}
            resource="directors"
            operation="directors"
        />
    );
}
