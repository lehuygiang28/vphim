'use client';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useList } from '@refinedev/core';

import { MovieSwiper } from '@/components/swiper/movie';
import { MOVIES_LIST_FOR_SWIPER_QUERY } from '@/queries/movies';
import { LoadingSpinner } from '@/components/loading';

const LazyMovieList = dynamic(() => import('@/components/list/movie-lazy-list'));

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import { MovieTypeEnum } from 'apps/api/src/app/movies/movie.constant';

export function Home() {
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

    if (mostViewedLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <>
            <div style={{ minHeight: '15vh' }}>
                <MovieSwiper movies={mostViewed?.data} />
            </div>

            <LazyMovieList
                title="PHIM MỚI"
                movieAsset={{
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
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="PHIM VIỆT CHIẾU RẠP"
                movieAsset={{
                    filters: [
                        {
                            field: 'cinemaRelease',
                            value: true,
                            operator: 'eq',
                        },
                        {
                            field: 'countries',
                            value: 'viet-nam',
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="PHIM LẺ ĐANG HOT"
                movieAsset={{
                    filters: [
                        {
                            field: 'type',
                            value: MovieTypeEnum.SINGLE,
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="PHIM BỘ ĐANG NỔI"
                movieAsset={{
                    filters: [
                        {
                            field: 'type',
                            value: MovieTypeEnum.SERIES,
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="TV SHOWS XEM NHIỀU"
                movieAsset={{
                    filters: [
                        {
                            field: 'type',
                            value: MovieTypeEnum.TV_SHOWS,
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="THẾ GIỚI HỌC ĐƯỜNG"
                movieAsset={{
                    filters: [
                        {
                            field: 'categories',
                            value: 'hoc-duong',
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="VƯƠNG QUỐC TRẺ EM"
                movieAsset={{
                    filters: [
                        {
                            field: 'categories',
                            value: 'tre-em',
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="PHIM HÀNH ĐỘNG"
                movieAsset={{
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
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="PHIM HOẠT HÌNH"
                movieAsset={{
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
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="PHIM VIỄN TƯỞNG"
                movieAsset={{
                    filters: [
                        {
                            field: 'categories',
                            value: 'vien-tuong,',
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'year',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />

            <LazyMovieList
                title="PHIM THẦN THOẠI"
                movieAsset={{
                    filters: [
                        {
                            field: 'categories',
                            value: 'than-thoai',
                            operator: 'eq',
                        },
                    ],
                    sorters: [
                        {
                            field: 'year',
                            order: 'desc',
                        },
                    ],
                }}
                activeList={activeList}
                setActiveList={setActiveList}
            />
        </>
    );
}
