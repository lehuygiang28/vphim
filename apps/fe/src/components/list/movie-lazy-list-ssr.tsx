import React from 'react';
import dynamic from 'next/dynamic';

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';

const MovieList = dynamic(() => import('@/components/swiper/movie-list'), { ssr: true });
import { slugifyVietnamese } from '@/libs/utils/movie.util';
import './movie-lazy-list-ssr.css';

interface ServerSideMovieListProps {
    title: string;
    activeList?: string | null;
    setActiveList?: React.Dispatch<React.SetStateAction<string | null>>;
    movies: MovieResponseDto[];
    viewMoreHref: string;
    isLoading?: boolean;
}

export function LazyMovieListSSR({
    title,
    viewMoreHref,
    activeList,
    setActiveList,
    movies,
    isLoading,
}: ServerSideMovieListProps) {
    const slugTitle = slugifyVietnamese(title);

    return (
        <div className="movie-section" onClick={() => setActiveList(slugTitle)}>
            <MovieList
                clearVisibleContentCard={activeList !== slugTitle}
                title={title}
                movies={movies}
                viewMoreHref={viewMoreHref}
                eagerLoad={3}
                isLoading={isLoading}
            />
        </div>
    );
}
