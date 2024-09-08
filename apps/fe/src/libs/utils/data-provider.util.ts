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

export function handlePaginationQuery(pagination?: Pagination) {
    return pagination
        ? { page: pagination.current, limit: pagination.pageSize }
        : { page: 1, limit: 10 };
}

export function handleFilterQuery(
    filters?: (CrudFilter & { field: string })[],
): Record<string, unknown> {
    return filters
        ? filters
              .filter((filter) => filter['field'])
              .reduce((acc, filter) => {
                  acc[filter['field']] = filter?.value ?? '';
                  return acc;
              }, {} as Record<string, unknown>)
        : {};
}

export function handleSortQuery(sorters?: CrudSort | CrudSort[]):
    | {
          sortBy: string;
          sortOrder: string;
      }
    | object {
    if (!sorters) return {};

    if (Array.isArray(sorters)) {
        const firstSorter = sorters[0];
        return firstSorter && firstSorter.field && firstSorter.order
            ? { sortBy: firstSorter.field, sortOrder: firstSorter.order }
            : {};
    }

    return sorters && sorters.field && sorters.order
        ? { sortBy: sorters.field, sortOrder: sorters.order }
        : {};
}
