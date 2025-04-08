'use client';

import React from 'react';
import { GET_DIRECTOR_LIST_QUERY, MNT_DIRECTOR_DELETE } from '~mnt/queries/director.query';
import { PersonResourceList } from '~mnt/components/list/person-resource-list';

export default function DirectorList() {
    return (
        <PersonResourceList
            title="Danh sách đạo diễn"
            createPath="/directors/create"
            deleteOperation="deleteDirector"
            gqlQuery={GET_DIRECTOR_LIST_QUERY}
            gqlDeleteMutation={MNT_DIRECTOR_DELETE}
            resource="directors"
            operation="directors"
        />
    );
}
