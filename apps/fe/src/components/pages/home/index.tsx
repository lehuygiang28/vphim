import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

import { MovieSwiper } from '@/components/swiper/movie';
import { MOVIES_LIST_FOR_SWIPER_QUERY } from '@/queries/movies';
import { getMovies } from '@/services/movies';
const HomeMovieLists = dynamic(() => import('./home-movie-lists'), {
    ssr: true,
});

export default async function Home() {
    const mostViewed = await getMovies({
        gqlQuery: MOVIES_LIST_FOR_SWIPER_QUERY,
        sorters: { field: 'view', order: 'desc' },
        operation: 'movies',
    });

    return (
        <Suspense>
            <div style={{ minHeight: '15vh' }}>
                <MovieSwiper movies={mostViewed} />
            </div>
            <HomeMovieLists />
        </Suspense>
    );
}
