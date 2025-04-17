/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { GetListResponse, GetListParams, BaseRecord, DeleteOneParams } from '@refinedev/core';
import { AxiosInstance } from 'axios';
import simpleRestProvider from '@refinedev/simple-rest';

import type { Movie } from 'apps/api/src/app/movies/movie.schema';

import { handleFilter, handlePagination, handleSort } from '@/libs/utils/data-provider.util';

export const restfulDataProvider = (axios: AxiosInstance) => {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}`;

    return {
        ...simpleRestProvider(apiUrl, axios),
        update: async ({ resource, id, variables, meta }) => {
            const url = `${apiUrl}/${resource}/${id}`;

            const { headers, method } = meta ?? {};
            const requestMethod = method ?? 'patch';

            const { data } = await axios.request({
                url,
                headers,
                method: requestMethod,
                data: variables,
            });

            return {
                data,
            };
        },
        getApiUrl: () => {
            return apiUrl;
        },
        getList: async ({
            resource,
            pagination,
            filters,
            sorters,
            meta,
        }: GetListParams): Promise<GetListResponse<BaseRecord & Movie>> => {
            let searchParams = new URLSearchParams();
            searchParams = handlePagination(searchParams, pagination);
            searchParams = handleFilter(searchParams, filters as any);
            searchParams = handleSort(searchParams, sorters);

            const {
                data: { data: tasks, total },
            } = await axios.get<any>(`${apiUrl}/${resource}?${searchParams}`);

            return {
                data: tasks.map((task: any) => ({ ...task, id: task._id.toString() })),
                total: total,
            };
        },
        deleteOne: async ({ resource, id, meta, variables }: DeleteOneParams) => {
            const url = `${resource}${meta?.params && '/' + meta?.params.join('/')}/${id}`;
            return axios.delete(url);
        },
    };
};
