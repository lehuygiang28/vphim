import { print } from 'graphql/language/printer';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';
import { DocumentNode } from 'graphql';
import { CrudFilters, CrudSort } from '@refinedev/core';
import { handleFilterQuery, handleSortQuery } from '@/libs/utils/data-provider.util';

export async function getMovieBySlug(slug: string): Promise<MovieType> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies/${slug}`);
    if (!res.ok) {
        throw new Error('Failed to fetch movie data');
    }
    return res.json();
}

export async function getMovies(data: {
    gqlQuery: DocumentNode;
    filter?: CrudFilters;
    sorters?: CrudSort;
    operation?: string;
}): Promise<MovieType[]> {
    const { gqlQuery, filter, sorters, operation = 'movies' } = data;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: print(gqlQuery),
            variables: {
                input: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ...(filter && handleFilterQuery(filter as any)),
                    ...(sorters && handleSortQuery(sorters)),
                },
            },
        }),
    });
    if (!res.ok) {
        throw new Error('Failed to fetch movies');
    }
    const result = await res.json();
    return result?.data?.[operation]?.data;
}
