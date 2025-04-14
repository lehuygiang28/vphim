import { RouteNameEnum } from '@/constants/route.constant';
import type { CrudFilter, CrudSort } from '@refinedev/core';
import qs, { type IStringifyOptions } from 'qs';

export const stringifyTableParams = (params: {
    pagination?: { current?: number; pageSize?: number };
    sorters: CrudSort[];
    filters: CrudFilter[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}): string => {
    const options: IStringifyOptions = {
        skipNulls: true,
        arrayFormat: 'indices',
        encode: false,
    };
    const { pagination = {}, sorter, sorters = [], filters = [], ...rest } = params;

    const queryString = qs.stringify(
        {
            ...rest,
            pagination,
            sorters,
            filters,
        },
        options,
    );

    return queryString;
};

export const createSearchUrl = (field: string, value: string) => {
    // Different entities have different field structures in the filter system
    let filterField = field;

    // Map the entity fields to their correct filter field names
    if (field === 'actor') filterField = 'keywords';
    if (field === 'director') filterField = 'keywords';
    if (field === 'category.slug') filterField = 'categories';
    if (field === 'country.slug') filterField = 'countries';

    const queryString = stringifyTableParams({
        filters: [
            {
                field: filterField,
                operator: 'eq',
                value,
            },
        ],
        sorters: [],
    });

    return `${RouteNameEnum.MOVIE_LIST_PAGE}?${queryString}`;
};
