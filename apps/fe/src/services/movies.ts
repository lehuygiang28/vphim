import type { MovieType } from 'apps/api/src/app/movies/movie.type';

export async function getMovieBySlug(slug: string): Promise<MovieType> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/movies/${slug}`);
    if (!res.ok) {
        throw new Error('Failed to fetch movie data');
    }
    return res.json();
}
