import { CrudFilter, CrudSort, Pagination } from '@refinedev/core';

export type MovieAsset = {
    filters: CrudFilter[];
    sorters: CrudSort[];
    pagination?: Pagination;
};
