'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { type CrudFilter, type CrudSort } from '@refinedev/core';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

import { LazyMovieListSSR } from '@/components/list/movie-lazy-list-ssr';
const LazyMovieList = dynamic(() => import('@/components/list/movie-lazy-list'), { ssr: true });

export type HomeMovieListsProps = {
    moviesWithAsset?: {
        title: string;
        movies: MovieType[];
        viewMoreHref: string;
    }[];
};

export default function HomeMovieLists({ moviesWithAsset }: HomeMovieListsProps) {
    const [activeList, setActiveList] = useState<string | null>(null);
    const setActiveListCallback = useCallback((list: string | null) => {
        setActiveList(list);
    }, []);

    const movieLists: { title: string; filters: CrudFilter[]; sorters: CrudSort[] }[] = useMemo(
        () => [
            {
                title: 'THẾ GIỚI HỌC ĐƯỜNG',
                filters: [{ field: 'categories', value: 'hoc-duong', operator: 'eq' }],
                sorters: [{ field: 'view', order: 'desc' }],
            },
            {
                title: 'VƯƠNG QUỐC TRẺ EM',
                filters: [{ field: 'categories', value: 'tre-em', operator: 'eq' }],
                sorters: [{ field: 'view', order: 'desc' }],
            },
            {
                title: 'PHIM HÀNH ĐỘNG',
                filters: [{ field: 'categories', value: 'hanh-dong', operator: 'eq' }],
                sorters: [{ field: 'year', order: 'desc' }],
            },
            {
                title: 'PHIM HOẠT HÌNH',
                filters: [{ field: 'categories', value: 'hoat-hinh,', operator: 'eq' }],
                sorters: [{ field: 'year', order: 'desc' }],
            },
            {
                title: 'PHIM VIỄN TƯỞNG',
                filters: [{ field: 'categories', value: 'vien-tuong,', operator: 'eq' }],
                sorters: [{ field: 'year', order: 'desc' }],
            },
            {
                title: 'PHIM THẦN THOẠI',
                filters: [{ field: 'categories', value: 'than-thoai', operator: 'eq' }],
                sorters: [{ field: 'year', order: 'desc' }],
            },
        ],
        [],
    );

    return (
        <>
            {moviesWithAsset &&
                moviesWithAsset?.length > 0 &&
                moviesWithAsset?.map((movieWithAsset, index) => (
                    <LazyMovieListSSR
                        key={`movie-list-${index}`}
                        activeList={activeList}
                        setActiveList={setActiveListCallback}
                        title={movieWithAsset.title}
                        movies={movieWithAsset.movies}
                        viewMoreHref={movieWithAsset.viewMoreHref}
                    />
                ))}

            {movieLists.map((list, index) => (
                <LazyMovieList
                    key={index}
                    title={list.title}
                    movieAsset={{
                        filters: list.filters,
                        sorters: list.sorters,
                    }}
                    activeList={activeList}
                    setActiveList={setActiveListCallback}
                />
            ))}
        </>
    );
}
