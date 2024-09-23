'use client';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import React, { useState } from 'react';
import { CrudFilter, CrudSort, stringifyTableParams, useList } from '@refinedev/core';
import { Grid } from 'antd';

import MovieList from '@/components/swiper/movie-list';
import { MovieSwiper } from '@/components/swiper/movie';
import { MOVIES_LIST_QUERY, MOVIES_LIST_FOR_SWIPER_QUERY } from '@/queries/movies';
import { RouteNameEnum } from '@/constants/route.constant';
import { LoadingSpinner } from '@/components/loading';

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';

const { useBreakpoint } = Grid;
type MovieAsset = {
    filters: CrudFilter[];
    sorters: CrudSort[];
};

const newMovieAsset: MovieAsset = {
    filters: [
        {
            field: 'years',
            value: `${new Date().getFullYear()}`,
            operator: 'eq',
        },
    ],
    sorters: [
        {
            field: 'year',
            order: 'asc',
        },
    ],
};

const actionMovieAsset: MovieAsset = {
    filters: [
        {
            field: 'categories',
            value: 'hanh-dong',
            operator: 'eq',
        },
    ],
    sorters: [
        {
            field: 'year',
            order: 'desc',
        },
    ],
};

const cartoonMovieAsset: MovieAsset = {
    filters: [
        {
            field: 'categories',
            value: 'hoat-hinh,',
            operator: 'eq',
        },
    ],
    sorters: [
        {
            field: 'year',
            order: 'desc',
        },
    ],
};

export function Home() {
    const { md } = useBreakpoint();
    const [activeList, setActiveList] = useState<string | null>(null);

    const { data: mostViewed, isLoading: mostViewedLoading } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_FOR_SWIPER_QUERY },
        resource: 'movies',
        sorters: [
            {
                field: 'view',
                order: 'desc',
            },
        ],
    });

    const { data: newMovies } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY },
        resource: 'movies',
        ...newMovieAsset,
    });

    const { data: actionMovies } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY },
        resource: 'movies',
        ...actionMovieAsset,
    });

    const { data: cartoonMovies } = useList<MovieResponseDto>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY },
        resource: 'movies',
        ...cartoonMovieAsset,
    });

    if (mostViewedLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <>
            <div style={{ minHeight: '15vh' }}>
                <MovieSwiper movies={mostViewed?.data} />
            </div>
            <div
                onClick={() => setActiveList('newMovies')}
                style={{
                    marginTop: '1rem',
                    marginLeft: md ? '3rem' : '0.7rem',
                    marginRight: md ? '3rem' : '0.7rem',
                }}
            >
                <MovieList
                    clearVisibleContentCard={activeList !== 'newMovies'}
                    title="PHIM MỚI"
                    movies={newMovies?.data}
                    viewMoreHref={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams(
                        actionMovieAsset,
                    )}`}
                />
            </div>

            <div
                onClick={() => setActiveList('actionMovies')}
                style={{
                    marginTop: '1rem',
                    marginLeft: md ? '3rem' : '0.7rem',
                    marginRight: md ? '3rem' : '0.7rem',
                }}
            >
                <MovieList
                    clearVisibleContentCard={activeList !== 'actionMovies'}
                    title="PHIM HÀNH ĐỘNG"
                    movies={actionMovies?.data}
                    viewMoreHref={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams(
                        actionMovieAsset,
                    )}`}
                />
            </div>

            <div
                onClick={() => setActiveList('cartoonMovies')}
                style={{
                    marginTop: '1rem',
                    marginLeft: md ? '3rem' : '0.7rem',
                    marginRight: md ? '3rem' : '0.7rem',
                }}
            >
                <MovieList
                    clearVisibleContentCard={activeList !== 'cartoonMovies'}
                    title="PHIM HOẠT HÌNH"
                    movies={cartoonMovies?.data}
                    viewMoreHref={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams(
                        cartoonMovieAsset,
                    )}`}
                />
            </div>
        </>
    );
}
