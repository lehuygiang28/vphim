/* eslint-disable @typescript-eslint/no-explicit-any */
import dataProvider, { GraphQLClient } from '@refinedev/graphql';
import { print } from 'graphql/language/printer';
import { AxiosInstance } from 'axios';
import camelCase from 'camelcase';
import pluralize from 'pluralize';
import { BaseRecord, GetListParams, GetListResponse, MetaQuery } from '@refinedev/core';
import { baseApiUrl } from '@/config';
import {
    handleFilterQuery,
    handlePaginationQuery,
    handleSortQuery,
} from '@/libs/utils/data-provider.util';

import type { Movie } from 'apps/api/src/app/movies/movie.schema';

const handleResetCache = (meta: MetaQuery): { [key: string]: boolean } | object => {
    if (meta?.resetCache && (meta?.resetCache === true || meta?.resetCache === 'true')) {
        return { resetCache: true };
    }

    if (meta?.bypassCache && (meta?.bypassCache === true || meta?.bypassCache === 'true')) {
        return { bypassCache: true };
    }

    return {};
};

export const graphqlDataProvider = (axios: AxiosInstance) => {
    const baseUrl = `${baseApiUrl}/graphql`;

    const client = new GraphQLClient(baseUrl, {
        fetch: axios,
    });

    const updateFn = async ({ resource, id, variables, meta }) => {
        const singularResource = pluralize.singular(resource) as string;
        const camelResource = camelCase(singularResource);
        const operation = meta?.operation ?? camelResource;

        const input = { ...variables, ...meta?.variables?.input };
        console.log(input);

        const {
            data: { data: res },
        } = await (axios as AxiosInstance).post<any>(baseUrl, {
            query: print((meta?.gqlMutation || meta?.gqlQuery) as any),
            variables: { input },
        });
        return { data: res?.[operation] };
    };

    return {
        ...dataProvider(client),
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
                baseUrl,
                JSON.stringify({
                    query: print(meta?.gqlQuery as any),
                    variables: {
                        input: variables,
                    },
                }),
            );

            const { data = [], total = 0 } = res[operation] || {};

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
            } = await axios.post<any>(baseUrl, {
                query: print(meta?.gqlQuery as any),
                variables,
            });

            return { data: res[operation] };
        },
        update: updateFn,
        deleteOne: updateFn,
    };
};
