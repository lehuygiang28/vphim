'use client';

import React from 'react';
import { GET_ACTOR_LIST_QUERY, MNT_ACTOR_DELETE } from '~mnt/queries/actor.query';
import { PersonResourceList } from '~mnt/components/list/person-resource-list';

export default function ActorList() {
    return (
        <PersonResourceList
            title="Danh sách diễn viên"
            createPath="/actors/create"
            deleteOperation="deleteActor"
            gqlQuery={GET_ACTOR_LIST_QUERY}
            gqlDeleteMutation={MNT_ACTOR_DELETE}
            resource="actors"
            operation="actors"
        />
    );
}
