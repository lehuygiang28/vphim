import React from 'react';
import { Breadcrumb } from 'antd';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { HomeOutlined } from '@ant-design/icons';

import { MoviePlay } from '@/components/pages/movie/play';
import { getEpisodeNameBySlug, getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { getMovieBySlug } from '@/services/movies';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export function generateStaticParams() {
    return [];
}

export type MovieEpisodePageProps = {
    params: { slug: string; episode: string };
};

export async function generateMetadata(
    { params }: MovieEpisodePageProps,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const movie = await getMovieBySlug(params.slug);
    const previousImages = (await parent).openGraph?.images || [];

    const episodeName = getEpisodeNameBySlug(movie, params.episode);
    const desString = `${episodeName} - ${movie.name} (${movie.originName})`;
    const title = `${desString} | VePhim`;
    const description = movie.content;
    const images = [
        movie?.posterUrl && {
            url: getOptimizedImageUrl(movie?.posterUrl, {
                width: 1200,
                height: 630,
                quality: 80,
            }),
            alt: movie?.name,
        },
        movie?.thumbUrl && {
            url: getOptimizedImageUrl(movie?.thumbUrl, {
                width: 1200,
                height: 630,
                quality: 80,
            }),
            alt: movie?.name,
        },
        ...previousImages,
    ].filter(Boolean);

    return {
        title,
        description,
        openGraph: {
            title,
            description: movie.content,
            url: `/phim/${movie?.slug}/${params.episode}`,
            images,
            siteName: 'VePhim',
            type: 'video.movie',
            actors: movie?.actors?.map((a) => a.name),
            directors: movie?.directors?.map((d) => d.name),
            countryName: movie?.countries?.map((c) => c.name).join(', '),
            releaseDate: movie?.year?.toString(),
            tags: [
                movie?.name,
                movie?.originName,
                ...(movie?.categories?.map((c) => c.name) || []),
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: images[0],
        },
        other: {
            'og:updated_time': new Date(movie?.lastSyncModified)?.toISOString(),
            'og:image:alt': movie?.name,
            'og:video': movie?.trailerUrl,
            'og:video:type': 'video/mp4',
            'og:video:width': '1920',
            'og:video:height': '1080',
            'og:locale': 'vi_VN',
            'og:country-name': movie?.countries?.map((c) => c.name).join(', '),
        },
    };
}

export default async function MovieEpisodePage({ params }: MovieEpisodePageProps) {
    const movie = await getMovieBySlug(params.slug);
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
