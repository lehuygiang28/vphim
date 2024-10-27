import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';

import { Movie } from '@/components/pages/movie';
import { getOptimizedImageUrl } from '@/libs/utils/movie.util';
import { getMovieBySlug, getMovies } from '@/services/movies';
import { MOVIES_LIST_QUERY_FOR_ISR } from '@/queries/movies';

// Add this export to enable ISR
export const revalidate = 3600; // Revalidate every hour

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Set this to a number to limit the maximum number of pages fetched,
// or set to null to fetch all pages
const MAX_PAGES: number | null = null;

export async function generateStaticParams() {
    const uniqueSlugs = new Set<string>();
    const pageSize = 500;
    let currentPage = 1;
    let hasMoreMovies = true;

    while (hasMoreMovies && (MAX_PAGES === null || currentPage <= MAX_PAGES)) {
        try {
            const movies = await getMovies({
                gqlQuery: MOVIES_LIST_QUERY_FOR_ISR,
                operation: 'movies',
                filters: [],
                sorters: { field: 'view', order: 'desc' },
                pagination: { current: currentPage, pageSize },
            });

            movies.forEach((movie) => uniqueSlugs.add(movie.slug));

            // Check if we've reached the end of available data
            hasMoreMovies = movies.length === pageSize;
            currentPage++;
        } catch (error) {
            console.error(`Error fetching movies, page ${currentPage}:`, error);
            hasMoreMovies = false;
        }
    }

    if (MAX_PAGES !== null && currentPage > MAX_PAGES) {
        console.log(`Reached maximum number of pages (${MAX_PAGES})`);
    } else if (!hasMoreMovies) {
        console.log('Fetched all available movies');
    }

    console.log(`Total unique movies fetched: ${uniqueSlugs.size}`);

    return Array.from(uniqueSlugs).map((slug) => ({ slug }));
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

export default async function MoviePage({ params }: MoviePageProps) {
    const movie = await getMovieBySlug(params.slug);

    return <Movie slug={params?.slug ?? ''} movie={movie} />;
}
