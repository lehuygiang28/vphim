'use client';

import { GetListResponse, GetListParams, BaseRecord, DeleteOneParams } from '@refinedev/core';
import dataProviderSimpleRest from '@refinedev/simple-rest';
import { AxiosInstance } from 'axios';
import { handleFilter, handlePagination, handleSort } from '@/libs/utils/data-provider.util';

import { type Movie } from 'apps/api/src/app/movies/movie.schema';

export const apiDataProvider = (axios: AxiosInstance) => ({
    ...dataProviderSimpleRest('', axios),
    getList: async ({
        resource,
        pagination,
        filters,
        sorters,
        meta,
    }: GetListParams): Promise<GetListResponse<BaseRecord & Movie>> => {
        const url = `${resource}`;

        let searchParams = new URLSearchParams();
        searchParams = handlePagination(searchParams, pagination);
        searchParams = handleFilter(searchParams, filters as any);
        searchParams = handleSort(searchParams, sorters);

        const {
            data: { data: tasks, total },
        } = await axios.get<any>(`${url}?${searchParams}`);

        return {
            data: tasks.map((task: any) => ({ ...task, id: task._id.toString() })),
            total: total,
        };
    },
    deleteOne: async ({ resource, id, meta, variables }: DeleteOneParams) => {
        if (meta?.params && Array.isArray(meta?.params)) {
            const url = `${resource}/${meta?.params.join('/')}/${id}`;
            return axios.delete(url);
        }

        return dataProviderSimpleRest('', axios).deleteOne({ resource, id, meta, variables });
    },
});

export default apiDataProvider;
