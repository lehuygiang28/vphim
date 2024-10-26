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
