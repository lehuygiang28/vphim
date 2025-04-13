import React from 'react';
import dynamic from 'next/dynamic';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

const MovieList = dynamic(() => import('@/components/swiper/movie-list'), { ssr: true });
import './movie-lazy-list-ssr.css';

interface ServerSideMovieListProps {
    title: string;
    movies: MovieType[];
    viewMoreHref: string;
    isLoading?: boolean;
}

export function LazyMovieListSSR({
    title,
    viewMoreHref,
    movies,
    isLoading,
}: ServerSideMovieListProps) {
    return (
        <div className="movie-section">
            <MovieList
                title={title}
                movies={movies}
                viewMoreHref={viewMoreHref}
                eagerLoad={3}
                isLoading={isLoading}
            />
        </div>
    );
}
