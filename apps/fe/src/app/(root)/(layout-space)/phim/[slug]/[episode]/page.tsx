'use client';

import React, { useEffect } from 'react';
import { useOne } from '@refinedev/core';
import { Breadcrumb } from 'antd';
import Link from 'next/link';
import { HomeOutlined } from '@ant-design/icons';
import { MoviePlay } from '@/components/pages/movie/play';
import { GET_MOVIE_QUERY } from '@/queries/movies';
import { getEpisodeNameBySlug } from '@/libs/utils/movie.util';
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
            <Breadcrumb
                style={{ marginBottom: '1rem' }}
                items={[
                    {
                        title: (
                            <Link href={'/'}>
                                <HomeOutlined style={{ marginRight: '0.5rem' }} />
                                Trang chủ
                            </Link>
                        ),
                    },
                    {
                        title: <Link href={'/phim'}>Phim</Link>,
                    },
                    {
                        title: <Link href={`/phim/${movie?.data?.slug}`}>{movie?.data?.name}</Link>,
                    },
                    {
                        title: (
                            <Link href={`/phim/${movie?.data?.slug}`}>
                                {getEpisodeNameBySlug(movie?.data, params?.episode)}
                            </Link>
                        ),
                    },
                ]}
            />
            <MoviePlay movie={movie?.data || null} episodeSlug={params?.episode || ''} />
        </>
    );
}
