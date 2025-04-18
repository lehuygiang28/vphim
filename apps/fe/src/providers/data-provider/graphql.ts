/* eslint-disable @typescript-eslint/no-explicit-any */
import { print } from 'graphql/language/printer';
import { AxiosInstance } from 'axios';
import camelCase from 'camelcase';
import pluralize from 'pluralize';
import { BaseRecord, GetListParams, GetListResponse, MetaQuery } from '@refinedev/core';

import type { Movie } from 'apps/api/src/app/movies/movie.schema';

import {
    handleFilterQuery,
    handlePaginationQuery,
    handleSortQuery,
} from '@/libs/utils/data-provider.util';

const handleResetCache = (meta: MetaQuery): { [key: string]: boolean } | object => {
    if (meta?.resetCache && (meta?.resetCache === true || meta?.resetCache === 'true')) {
        return { resetCache: true };
    }

    if (meta?.bypassCache && (meta?.bypassCache === true || meta?.bypassCache === 'true')) {
        return { bypassCache: true };
    }

    return {};
};

export const graphqlDataProvider = (
    axios: AxiosInstance,
    { publicApiUrl = '' }: { publicApiUrl?: string } = {},
) => {
    const baseUrl = publicApiUrl ?? process.env.NEXT_PUBLIC_API_URL;
    const graphqlApiUrl = `${baseUrl}/graphql`;

    const updateFn = async ({ resource, id, variables, meta }) => {
        const singularResource = pluralize.singular(resource) as string;
        const camelResource = camelCase(singularResource);
        const operation = meta?.operation ?? camelResource;

        const input = { ...variables, ...meta?.variables?.input };

        const {
            data: { data: res },
        } = await axios.post<any>(graphqlApiUrl, {
            query: print((meta?.gqlMutation || meta?.gqlQuery) as any),
            variables: { input },
        });
        return { data: res?.[operation] };
    };

    return {
        getApiUrl: () => {
            return baseUrl;
        },
        create: ({ resource, variables, meta }) =>
            updateFn({ resource, variables: variables, meta, id: '' }),
        getList: async ({
            resource,
            pagination,
            filters,
            sorters,
            meta,
        }: GetListParams): Promise<GetListResponse<BaseRecord & Movie>> => {
            const camelResource = camelCase(resource);
            const operation = meta?.operation ?? camelResource;

            const variables = {
                ...meta?.variables,
                ...handlePaginationQuery(pagination),
                ...(sorters && handleSortQuery(sorters)),
                ...(filters && handleFilterQuery(filters as any)),
                ...handleResetCache(meta),
            };

            const {
                data: { data: res },
            } = await axios.post<any>(
                graphqlApiUrl,
                JSON.stringify({
                    query: print(meta?.gqlQuery as any),
                    variables: {
                        input: variables,
                    },
                }),
            );

            const { data = [], total = 0 } = res?.[operation] || {};

            return {
                data: data.map((d: any) => ({ ...d, id: d?._id?.toString() })),
                total: total,
            };
        },
        getOne: async ({
            resource,
            id,
            meta,
        }: {
            resource: string;
            id: BaseRecord['id'];
            meta: MetaQuery;
        }) => {
            const singularResource = pluralize.singular(resource) as string;
            const camelResource = camelCase(singularResource);
            const operation = meta?.operation ?? camelResource;

            const variables = {
                id,
                ...meta?.variables,
            };

            const {
                data: { data: res },
            } = await axios.post<any>(graphqlApiUrl, {
                query: print(meta?.gqlQuery as any),
                variables,
            });

            return { data: res?.[operation] };
        },
        update: updateFn,
        deleteOne: updateFn,
        getMany: async ({ resource, ids, meta }) => {
            const camelResource = camelCase(resource);
            const operation = meta?.operation ?? camelResource;

            const variablesInput = {
                ...meta?.variables,
                ids,
            };

            const {
                data: { data: res },
            } = await axios.post<any>(
                graphqlApiUrl,
                JSON.stringify({
                    query: print(meta?.gqlQuery as any),
                    variables: {
                        input: variablesInput,
                    },
                }),
            );

            const { data = [], total = 0 } = res?.[operation] || {};

            return {
                data: data.map((d: any) => ({ ...d, id: d?._id?.toString() })),
                total: total,
            };
        },
        custom: async ({ resource, variables, meta, method = 'post' }) => {
            const camelResource = resource ? camelCase(resource) : '';
            const operation = meta?.operation ?? camelResource;

            const {
                data: { data: res },
            } = await axios.request<any>({
                method,
                url: graphqlApiUrl,
                data: {
                    query: print(meta?.gqlQuery || meta?.gqlMutation),
                    variables: { ...variables, ...meta?.variables },
                },
            });

            return { data: res?.[operation] };
        },
    };
};
