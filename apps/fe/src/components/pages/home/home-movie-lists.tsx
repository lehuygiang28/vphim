'use client';

import React, { useState, useCallback } from 'react';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

import { LazyMovieListSSR } from '@/components/list/movie-lazy-list-ssr';
import './home-movie-lists.css';

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

    return (
        <div className="movie-lists-container">
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
        </div>
    );
}
