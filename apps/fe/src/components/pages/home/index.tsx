import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { CrudFilters, CrudSort, Pagination } from '@refinedev/core';

import { MovieTypeEnum } from 'apps/api/src/app/movies/movie.constant';

import { MovieSwiper } from '@/components/swiper/movie';
import { MOVIES_LIST_FOR_SWIPER_QUERY, MOVIES_LIST_QUERY } from '@/queries/movies';
import { getMovies } from '@/services/movies';
import { RouteNameEnum } from '@/constants/route.constant';
import { stringifyTableParams } from '@/libs/utils/url.util';
import './home.css';

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
        filters: [
            {
                field: 'years',
                value: `${new Date().getFullYear()},${new Date().getFullYear() - 1}`,
                operator: 'eq',
            },
        ],
        sorters: [{ field: 'year', order: 'desc' }],
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
    {
        title: 'THẾ GIỚI HỌC ĐƯỜNG',
        filters: [{ field: 'categories', value: 'hoc-duong', operator: 'eq' }],
        sorters: [{ field: 'view', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'VƯƠNG QUỐC TRẺ EM',
        filters: [{ field: 'categories', value: 'tre-em', operator: 'eq' }],
        sorters: [{ field: 'view', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'PHIM HÀNH ĐỘNG',
        filters: [{ field: 'categories', value: 'hanh-dong', operator: 'eq' }],
        sorters: [{ field: 'year', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'PHIM HOẠT HÌNH',
        filters: [{ field: 'categories', value: 'hoat-hinh,', operator: 'eq' }],
        sorters: [{ field: 'year', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'PHIM VIỄN TƯỞNG',
        filters: [{ field: 'categories', value: 'vien-tuong,', operator: 'eq' }],
        sorters: [{ field: 'year', order: 'desc' }],
        pagination: { current: 1, pageSize: 12 },
    },
    {
        title: 'PHIM THẦN THOẠI',
        filters: [{ field: 'categories', value: 'than-thoai', operator: 'eq' }],
        sorters: [{ field: 'year', order: 'desc' }],
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
                pagination: asset.pagination,
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
        <div className="home-container">
            <section className="hero-section">
                <Suspense
                    fallback={<div className="hero-skeleton" style={{ minHeight: '80vh' }} />}
                >
                    <MovieSwiper movies={mostViewed} />
                </Suspense>
            </section>

            <section className="content-section">
                <Suspense
                    fallback={<div className="content-skeleton" style={{ minHeight: '50vh' }} />}
                >
                    <HomeMovieLists moviesWithAsset={homeMovieListsData} />
                </Suspense>
            </section>
        </div>
    );
}
