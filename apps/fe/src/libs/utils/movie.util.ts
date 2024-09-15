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
