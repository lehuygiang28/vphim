'use client';

import React from 'react';

import { MNT_CATEGORIES_LIST_QUERY, MNT_CATEGORY_DELETE } from '~mnt/queries/category.query';
import { SimpleResourceList } from '~mnt/components/list/simple-resource-list';

export default function CategoryList() {
    return (
        <SimpleResourceList
            createPath="/categories/create"
            deleteOperation="deleteCategory"
            gqlQuery={MNT_CATEGORIES_LIST_QUERY}
            gqlDeleteMutation={MNT_CATEGORY_DELETE}
            resource="categories"
            operation="categories"
        />
    );
}
