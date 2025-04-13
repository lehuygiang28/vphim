'use client';

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
    return (
        <div className="movie-lists-container">
            {moviesWithAsset &&
                moviesWithAsset?.length > 0 &&
                moviesWithAsset?.map((movieWithAsset, index) => (
                    <LazyMovieListSSR
                        key={`movie-list-${index}`}
                        title={movieWithAsset.title}
                        movies={movieWithAsset.movies}
                        viewMoreHref={movieWithAsset.viewMoreHref}
                    />
                ))}
        </div>
    );
}
