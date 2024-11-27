import slugify from 'slugify';
import { removeDiacritics, removeTone } from '@vn-utils/text';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

import { canParseToNumber } from './common';

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
        useApi: boolean;
    },
) {
    const {
        width,
        height,
        quality = 60,
        baseUrl = process.env.NEXT_PUBLIC_API_URL,
        useApi = false,
    } = option;
    const imageSever = process.env.NEXT_PUBLIC_IMAGES_URL;
    const queryParams = `url=${encodeURIComponent(url)}&w=${width}&h=${height}&q=${quality}`;
    if (!useApi) {
        return `${imageSever}/?${queryParams}`;
    }
    return `${baseUrl}/api/images/optimize?${queryParams}`;
}

export function slugifyVietnamese(str: string) {
    if (!str) {
        return '';
    }
    return slugify(removeTone(removeDiacritics(str)), { lower: true, locale: 'vi' });
}

export function truncateText(text: string, maxLength = 100, ellipsis = '...'): string {
    if (!text) {
        return '';
    }

    // Ensure maxLength is at least the length of the ellipsis
    maxLength = Math.max(ellipsis.length, maxLength);

    if (text.length <= maxLength) {
        return text;
    }

    // Adjust maxLength to account for ellipsis length
    const truncationLength = maxLength - ellipsis.length;
    let truncated = text.substring(0, truncationLength);

    // Find the last space within the truncated text
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    // If a space is found, truncate at that point
    if (lastSpaceIndex > 0) {
        truncated = truncated.substring(0, lastSpaceIndex);
    }

    return truncated + ellipsis;
}
