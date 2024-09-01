import { CrudFilter, CrudSort, Pagination } from '@refinedev/core';

export function handlePagination(searchParams: URLSearchParams, pagination?: Pagination) {
    if (pagination) {
        const { current, pageSize } = pagination;
        searchParams.set('page', String(current));
        searchParams.set('limit', String(pageSize));
    }

    return searchParams;
}

export function handleFilter(
    searchParams: URLSearchParams,
    filters?: (CrudFilter & { field: string })[],
) {
    if (filters) {
        filters.forEach((filter) => {
            if (filter['field']) {
                searchParams.set(filter['field'], String(filter.value));
            }
        });
    }

    return searchParams;
}

export function handleSort(searchParams: URLSearchParams, sorters?: CrudSort | CrudSort[]) {
    if (sorters) {
        if (Array.isArray(sorters)) {
            if (sorters[0]?.field && sorters[0]?.order) {
                searchParams.set('sortBy', String(sorters[0]?.field));
                searchParams.set('sortOrder', String(sorters[0]?.order));
            }
        } else if (sorters.field && sorters.order) {
            searchParams.set('sortBy', sorters.field);
            searchParams.set('sortOrder', sorters.order);
        }
    }

    return searchParams;
}
