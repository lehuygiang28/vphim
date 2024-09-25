import { DocumentNode } from 'graphql';
import { print } from 'graphql/language/printer';

import { useAxiosAuth } from './useAxiosAuth';

export function useGraphQL() {
    const axiosAuth = useAxiosAuth({ baseURL: process.env.BASE_API_URL });

    const query = async ({
        query,
        operation,
        variables,
    }: {
        query: DocumentNode;
        variables?: Record<string, unknown>;
        operation?: string;
    }) => {
        const {
            data: { data: res },
        } = await axiosAuth.post('/graphql', { query: print(query), variables });
        const result = operation ? res?.[operation] : res;
        return result;
    };

    return { query, mutation: query };
}
