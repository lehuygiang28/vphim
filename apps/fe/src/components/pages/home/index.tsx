import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { CrudFilters, CrudSort, Pagination } from '@refinedev/core';

import { MovieTypeEnum } from 'apps/api/src/app/movies/movie.constant';

import { MovieSwiper } from '@/components/swiper/movie';
import { MOVIES_LIST_FOR_SWIPER_QUERY, MOVIES_LIST_QUERY } from '@/queries/movies';
import { getMovies } from '@/services/movies';
import { RouteNameEnum } from '@/constants/route.constant';
import { stringifyTableParams } from '@/libs/utils/url.util';
const HomeMovieLists = dynamic(() => import('./home-movie-lists'), {
    ssr: true,
});

const HOME_MOVIES_LIST_ASSET: {
    title: string;
    filters: CrudFilters;
    sorters: CrudSort[];
    pagination: Pagination;
}[] = [
    {
        title: 'PHIM MỚI',
        filters: [{ field: 'years', value: `${new Date().getFullYear()}`, operator: 'eq' }],
        sorters: [{ field: 'year', order: 'asc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'PHIM VIỆT CHIẾU RẠP',
        filters: [
            { field: 'cinemaRelease', value: true, operator: 'eq' },
            { field: 'countries', value: 'viet-nam', operator: 'eq' },
        ],
        sorters: [{ field: 'view', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'PHIM LẺ ĐANG HOT',
        filters: [{ field: 'type', value: MovieTypeEnum.SINGLE, operator: 'eq' }],
        sorters: [{ field: 'view', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'PHIM BỘ ĐANG NỔI',
        filters: [{ field: 'type', value: MovieTypeEnum.SERIES, operator: 'eq' }],
        sorters: [{ field: 'view', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'TV SHOWS XEM NHIỀU',
        filters: [{ field: 'type', value: MovieTypeEnum.TV_SHOWS, operator: 'eq' }],
        sorters: [{ field: 'view', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
];

export default async function Home() {
    const [mostViewed, ...homeMovieListsData] = await Promise.all([
        getMovies({
            gqlQuery: MOVIES_LIST_FOR_SWIPER_QUERY,
            sorters: { field: 'view', order: 'desc' },
            operation: 'movies',
        }),
        ...HOME_MOVIES_LIST_ASSET.map(async (asset) => {
            const movies = await getMovies({
                gqlQuery: MOVIES_LIST_QUERY,
                filters: asset.filters,
                sorters: asset.sorters[0],
                operation: 'movies',
            });
            return {
                movies,
                title: asset.title,
                viewMoreHref: `${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                    pagination: asset.pagination,
                    filters: asset.filters,
                    sorters: asset.sorters,
                })}`,
            };
        }),
    ]);

    return (
        <Suspense>
            <div style={{ minHeight: '15vh' }}>
                <MovieSwiper movies={mostViewed} />
            </div>
            <HomeMovieLists moviesWithAsset={homeMovieListsData} />
        </Suspense>
    );
}
