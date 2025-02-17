import React from 'react';
import { CrudFilters, stringifyTableParams, useList } from '@refinedev/core';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

import MovieList from '@/components/swiper/movie-list';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieAsset } from '@/types/movie-asset.type';

export type MovieRelatedProps = {
    movie: MovieType;
};

export function MovieRelated({ movie }: MovieRelatedProps) {
    const asset: MovieAsset = {
        filters: [
            ...(movie?.categories && movie?.categories?.length > 0
                ? ([
                      {
                          field: 'categories',
                          operator: 'in',
                          value: movie?.categories?.map((item) => item.slug).join(','),
                      },
                  ] satisfies CrudFilters)
                : []),
            ...(movie?.type
                ? ([
                      {
                          field: 'type',
                          operator: 'eq',
                          value: movie?.type,
                      },
                  ] satisfies CrudFilters)
                : []),
            ...(!movie?.categories
                ? ([
                      {
                          field: 'actors',
                          operator: 'in',
                          value: movie?.actors?.map((item) => item.name).join(','),
                      },
                  ] satisfies CrudFilters)
                : []),
        ],
        sorters: [
            {
                field: 'view',
                order: 'desc',
            },
        ],
    };

    const { data: movies, isLoading } = useList<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        pagination: {
            current: 1,
            pageSize: 24,
            mode: 'server',
        },
        ...asset,
    });

    return (
        <>
            <MovieList
                title="Phim liên quan"
                movies={movies?.data}
                isLoading={isLoading}
                viewMoreHref={`/danh-sach-phim?${stringifyTableParams(asset)}`}
                style={{
                    overflow: 'visible',
                }}
            />
        </>
    );
}
