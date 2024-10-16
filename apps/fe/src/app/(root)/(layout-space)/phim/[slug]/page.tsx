import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';

import { Movie } from '@/components/pages/movie';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { getMovieBySlug } from '@/services/movies';

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
