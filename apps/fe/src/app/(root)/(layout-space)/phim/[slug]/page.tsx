import React from 'react';
import { Movie } from '@/components/pages/movie';
import { Metadata, ResolvingMetadata } from 'next';
import type { MovieType } from 'apps/api/src/app/movies/movie.type';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';

export type MoviePageProps = {
    params: { slug: string };
};

export async function generateMetadata(
    { params }: MoviePageProps,
    parent: ResolvingMetadata,
): Promise<Metadata> {
    // Fetch movie data
    const movie = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies/${params.slug}`).then(
        (res) => res.json() as unknown as MovieType,
    );

    // Optionally access and extend parent metadata
    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${movie?.name} (${movie?.originName}) | VePhim`,
        description: movie.content,
        openGraph: {
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

export default function MoviePage({ params }: MoviePageProps) {
    return <Movie slug={params?.slug ?? ''} />;
}
