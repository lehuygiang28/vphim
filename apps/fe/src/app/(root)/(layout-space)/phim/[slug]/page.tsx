import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';

import { Movie } from '@/components/pages/movie';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { getMovieBySlug } from '@/services/movies';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
    return [];
}

export type MoviePageProps = {
    params: { slug: string };
};

export async function generateMetadata(
    { params }: MoviePageProps,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const movie = await getMovieBySlug(params.slug);

    // Optionally access and extend parent metadata
    const previousImages = (await parent).openGraph?.images || [];

    const title = `${movie?.name} (${movie?.originName}) | VePhim`;
    const description = movie.content;
    const url = `/phim/${movie?.slug}`;

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
            description,
            url,
            siteName: 'VePhim',
            images,
            locale: 'vi_VN',
            type: 'video.movie',
            videos: movie?.trailerUrl ? [movie.trailerUrl] : undefined,
            actors: movie?.actors?.map((a) => a.name),
            directors: movie?.directors?.map((d) => d.name),
            tags: [
                movie?.name,
                movie?.originName,
                ...(movie?.categories?.map((c) => c.name) || []),
            ],
            releaseDate: movie?.year?.toString(),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: images[0],
        },
        other: {
            'og:updated_time': new Date(movie?.lastSyncModified).toISOString(),
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

export default async function MoviePage({ params }: MoviePageProps) {
    const movie = await getMovieBySlug(params.slug);

    return <Movie slug={params?.slug ?? ''} movie={movie} />;
}
