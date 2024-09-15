'use client';

import React, { useEffect } from 'react';
import { useOne } from '@refinedev/core';
import { MoviePlay } from '@/components/pages/movie/play';
import { GET_MOVIE_QUERY } from '@/queries/movies';

import { MovieType } from 'apps/api/src/app/movies/movie.type';

export type MovieEpisodePageProps = {
    params: { slug: string; episode: string };
};

export default function MovieEpisodePage({ params }: MovieEpisodePageProps) {
    const { data: movie } = useOne<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: {
            gqlQuery: GET_MOVIE_QUERY,
            operation: 'movie',
            variables: {
                input: {
                    slug: params?.slug,
                },
            },
        },
        id: params?.slug,
    });

    useEffect(() => {
        if (movie?.data) {
            document.title = `${movie?.data?.name} - ${movie?.data?.originName} | VePhim`;
        }
    }, [movie]);

    return (
        <>
            <MoviePlay movie={movie?.data || null} episodeSlug={params?.episode || ''} />
        </>
    );
}
