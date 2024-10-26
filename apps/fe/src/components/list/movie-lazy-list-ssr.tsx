import React from 'react';
import { Grid } from 'antd';

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';

import MovieList from '@/components/swiper/movie-list';
import { slugifyVietnamese } from '@/libs/utils/movie.util';

const { useBreakpoint } = Grid;

interface ServerSideMovieListProps {
    title: string;
    activeList: string | null;
    setActiveList: React.Dispatch<React.SetStateAction<string | null>>;
    movies: MovieResponseDto[];
    viewMoreHref: string;
}

export function LazyMovieListSSR({
    title,
    viewMoreHref,
    activeList,
    setActiveList,
    movies,
}: ServerSideMovieListProps) {
    const { md } = useBreakpoint();
    const slugTitle = slugifyVietnamese(title);

    return (
        <div
            style={{
                marginBottom: md ? '4rem' : '3.5rem',
                marginLeft: md ? '3rem' : '0.7rem',
                marginRight: md ? '3rem' : '0.7rem',
                minHeight: '200px', // Prevent layout shift
            }}
            onClick={() => setActiveList(slugTitle)}
        >
            <MovieList
                clearVisibleContentCard={activeList !== slugTitle}
                title={title}
                movies={movies}
                viewMoreHref={viewMoreHref}
            />
        </div>
    );
}
