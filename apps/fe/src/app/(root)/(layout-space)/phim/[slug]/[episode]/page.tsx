import React from 'react';
import { Breadcrumb } from 'antd';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { HomeOutlined } from '@ant-design/icons';

import { MoviePlay } from '@/components/pages/movie/play';
import { getEpisodeNameBySlug, getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { MovieType } from 'apps/api/src/app/movies/movie.type';

export type MovieEpisodePageProps = {
    params: { slug: string; episode: string };
};

async function getMovieData(slug: string): Promise<MovieType> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies/${slug}`);
    if (!res.ok) {
        throw new Error('Failed to fetch movie data');
    }
    return res.json();
}

export async function generateMetadata(
    { params }: MovieEpisodePageProps,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const movie = await getMovieData(params.slug);
    const episodeName = getEpisodeNameBySlug(movie, params.episode);
    const desString = `${episodeName} - ${movie.name} (${movie.originName})`;

    const previousImages = (await parent).openGraph?.images || [];
    return {
        title: `${desString} | VePhim`,
        description: `${desString} trên VePhim`,
        openGraph: {
            title: `${desString} | VePhim`,
            description: `Xem ${desString} trên VePhim`,
            images: [
                movie?.posterUrl &&
                    getOptimizedImageUrl(movie?.posterUrl, {
                        width: 1200,
                        height: 630,
                        quality: 80,
                    }),
                movie?.thumbUrl &&
                    getOptimizedImageUrl(movie?.thumbUrl, {
                        width: 1200,
                        height: 630,
                        quality: 80,
                    }),
                ...previousImages,
            ],
        },
    };
}

export default async function MovieEpisodePage({ params }: MovieEpisodePageProps) {
    const movie = await getMovieData(params.slug);
    const episodeName = getEpisodeNameBySlug(movie, params.episode);

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
                        title: <Link href={'/danh-sach-phim'}>Danh sách phim</Link>,
                    },
                    {
                        title: <Link href={`/phim/${movie.slug}`}>{movie.name}</Link>,
                    },
                    {
                        title: (
                            <Link href={`/phim/${movie.slug}/${params.episode}`}>
                                {episodeName}
                            </Link>
                        ),
                    },
                ]}
            />
            <MoviePlay movie={movie} episodeSlug={params.episode} />
        </>
    );
}
