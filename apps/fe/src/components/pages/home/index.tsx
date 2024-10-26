'use client';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import React from 'react';
import dynamic from 'next/dynamic';
import { useList } from '@refinedev/core';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

import { MovieSwiper } from '@/components/swiper/movie';
import { MOVIES_LIST_FOR_SWIPER_QUERY } from '@/queries/movies';
import { LoadingSpinner } from '@/components/loading';
const HomeMovieLists = dynamic(() => import('./home-movie-lists'), {
    ssr: true,
});

export default function Home() {
    const { data: mostViewed, isLoading: mostViewedLoading } = useList<MovieType>({
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
            <HomeMovieLists />
        </>
    );
}
