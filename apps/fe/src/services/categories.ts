import { DocumentNode } from 'graphql';
import { print } from 'graphql/language/printer';
import type { CrudFilters, CrudSort, Pagination } from '@refinedev/core';

import type { CategoryType } from 'apps/api/src/app/categories';

import {
    handleFilterQuery,
    handlePaginationQuery,
    handleSortQuery,
} from '@/libs/utils/data-provider.util';
import { CATEGORIES_LIST_QUERY } from '@/queries/categories';

export async function getCategories(data: {
    gqlQuery?: DocumentNode;
    filters?: CrudFilters;
    sorters?: CrudSort;
    pagination?: Pagination;
    operation?: string;
}): Promise<CategoryType[]> {
    const {
        gqlQuery = CATEGORIES_LIST_QUERY,
        filters,
        sorters,
        pagination,
        operation = 'categories',
    } = data;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: print(gqlQuery),
            variables: {
                input: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...(filters && handleFilterQuery(filters as any)),
                    ...(sorters && handleSortQuery(sorters)),
                    ...(pagination && handlePaginationQuery(pagination)),
                },
            },
        }),
        next: {
            revalidate: 3600,
            tags: ['categories'],
        },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch categories');
    }
    const result = await res.json();
    return result?.data?.[operation]?.data;
}
