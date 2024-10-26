import { DocumentNode } from 'graphql';
import { print } from 'graphql/language/printer';
import type { CrudFilters, CrudSort, Pagination } from '@refinedev/core';

import type { RegionType } from 'apps/api/src/app/regions/region.type';

import { REGIONS_LIST_QUERY } from '@/queries/regions';

import {
    handleFilterQuery,
    handlePaginationQuery,
    handleSortQuery,
} from '@/libs/utils/data-provider.util';

export async function getRegions(data: {
    gqlQuery?: DocumentNode;
    filters?: CrudFilters;
    sorters?: CrudSort;
    pagination?: Pagination;
    operation?: string;
}): Promise<RegionType[]> {
    const {
        filters,
        sorters,
        pagination,
        gqlQuery = REGIONS_LIST_QUERY,
        operation = 'regions',
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
        },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch regions');
    }
    const result = await res.json();
    return result?.data?.[operation]?.data;
}
