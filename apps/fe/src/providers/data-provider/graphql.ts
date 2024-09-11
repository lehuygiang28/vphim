import dataProvider, { GraphQLClient } from '@refinedev/graphql';
import { print } from 'graphql/language/printer';
import { AxiosInstance } from 'axios';
import camelCase from 'camelcase';
import { BaseRecord, GetListParams, GetListResponse } from '@refinedev/core';
import { baseApiUrl } from '@/config';
import {
    handleFilterQuery,
    handlePaginationQuery,
    handleSortQuery,
} from '@/libs/utils/data-provider.util';

import type { Movie } from 'apps/api/src/app/movies/movie.schema';

export const graphqlDataProvider = (axios: AxiosInstance) => {
    const baseUrl = `${baseApiUrl}/graphql`;

    const client = new GraphQLClient(baseUrl, {
        fetch: axios,
    });

    return {
        ...dataProvider(client),
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
    };
};
