import { canParseToNumber } from './common';
import type { MovieType } from 'apps/api/src/app/movies/movie.type';

export function getFirstEpisodeSlug(movie?: MovieType): string {
    if (!movie) {
        return 'trailer';
    }

    if (movie?.episode && movie?.episode.length > 0) {
        for (const episode of movie.episode) {
            if (episode.serverData && episode.serverData.length > 0) {
                return episode.serverData[0].slug;
            }
        }
    }

    return 'trailer';
}

export function getEpisodeNameBySlug(movie: MovieType, slug: string): string {
    if (!movie) {
        return 'Trailer';
    }

    if (movie?.episode && movie?.episode?.length > 0) {
        if (slug) {
            for (const episode of movie.episode) {
                if (episode.serverData && episode.serverData.length > 0) {
                    for (const server of episode.serverData) {
                        if (server.slug === slug) {
                            const name = canParseToNumber(server.name)
                                ? `Tập ${server.name}`
                                : server.name;
                            return name;
                        }
                    }
                }
            }
        }
    }

    return 'Trailer';
}

export function getOptimizedImageUrl(
    url: string,
    option: {
        width: number | string;
        height: number | string;
        quality?: number | string;
        baseUrl?: string;
    },
) {
    const { width, height, quality = 60 } = option;
    return `${
        option?.baseUrl || process.env.NEXT_PUBLIC_API_URL
    }/api/images/optimize?url=${encodeURIComponent(
        url,
    )}&width=${width}&height=${height}&quality=${quality}`;
}
