'use client';

import React from 'react';
import { GET_ACTOR_LIST_QUERY, MNT_ACTOR_DELETE } from '~mnt/queries/actor.query';
import ResourceList from '~mnt/components/list/resource-list';

export default function ActorList() {
    return (
        <ResourceList
            createPath="/actors/create"
            deleteOperation="deleteActor"
            gqlQuery={GET_ACTOR_LIST_QUERY}
            gqlDeleteMutation={MNT_ACTOR_DELETE}
            resource="actors"
            operation="actors"
        />
    );
}
