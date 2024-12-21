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
            const sortBy = sorters?.map((sorter) => sorter.field).join(',');
            const sortOrder = sorters?.map((sorter) => sorter.order).join(',');
            if (sortBy && sortOrder) {
                searchParams.set('sortBy', sortBy);
                searchParams.set('sortOrder', sortOrder);
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
                  if (
                      filter['field'] === 'cinemaRelease' ||
                      filter['field'] === 'isCopyright' ||
                      filter['field'] === 'useAI'
                  ) {
                      acc[filter['field']] = filter?.value === 'true' || filter?.value === true;
                  } else {
                      acc[filter['field']] = filter?.value ?? '';
                  }
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
        const sortBy = sorters.map((sorter) => sorter.field).join(',');
        const sortOrder = sorters.map((sorter) => sorter.order).join(',');
        return sortBy && sortOrder ? { sortBy, sortOrder } : {};
    }

    return sorters && sorters.field && sorters.order
        ? { sortBy: sorters.field, sortOrder: sorters.order }
        : {};
}
