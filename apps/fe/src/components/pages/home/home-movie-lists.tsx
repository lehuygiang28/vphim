'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { type CrudFilter, type CrudSort } from '@refinedev/core';

import { MovieTypeEnum } from 'apps/api/src/app/movies/movie.constant';

const LazyMovieList = dynamic(() => import('@/components/list/movie-lazy-list'), { ssr: false });

export default function HomeMovieLists() {
    const [activeList, setActiveList] = useState<string | null>(null);

    const setActiveListCallback = useCallback((list: string | null) => {
        setActiveList(list);
    }, []);

    const movieLists: { title: string; filters: CrudFilter[]; sorters: CrudSort[] }[] = useMemo(
        () => [
            {
                title: 'PHIM MỚI',
                filters: [{ field: 'years', value: `${new Date().getFullYear()}`, operator: 'eq' }],
                sorters: [{ field: 'year', order: 'asc' }],
            },
            {
                title: 'PHIM VIỆT CHIẾU RẠP',
                filters: [
                    { field: 'cinemaRelease', value: true, operator: 'eq' },
                    { field: 'countries', value: 'viet-nam', operator: 'eq' },
                ],
                sorters: [{ field: 'view', order: 'desc' }],
            },
            {
                title: 'PHIM LẺ ĐANG HOT',
                filters: [{ field: 'type', value: MovieTypeEnum.SINGLE, operator: 'eq' }],
                sorters: [{ field: 'view', order: 'desc' }],
            },
            {
                title: 'PHIM BỘ ĐANG NỔI',
                filters: [{ field: 'type', value: MovieTypeEnum.SERIES, operator: 'eq' }],
                sorters: [{ field: 'view', order: 'desc' }],
            },
            {
                title: 'TV SHOWS XEM NHIỀU',
                filters: [{ field: 'type', value: MovieTypeEnum.TV_SHOWS, operator: 'eq' }],
                sorters: [{ field: 'view', order: 'desc' }],
            },
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
