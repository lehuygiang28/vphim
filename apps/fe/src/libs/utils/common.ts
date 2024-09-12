import { EpisodeType, MovieType } from 'apps/api/src/app/movies/movie.type';

export function sortArrayByKey<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    if (!array) {
        return [];
    }
    const cloneArray = [...array];
    return cloneArray.sort((a, b) => {
        if (a[key] < b[key]) {
            return order === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
}

export function camelCaseToCapitalizedWords(str: string) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}

export function randomString(length: number, { onlyLetters = false } = {}): string {
    let result = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const characters = onlyLetters ? letters : letters + '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function getEpisodesWithMaxServerDataLength(movie: MovieType): EpisodeType {
    if (!movie?.episode || movie?.episode?.length === 0) {
        throw new Error('Movie has no episode');
    }

    const maxServerDataLength = Math.max(
        ...movie.episode.map((episode) => episode.serverData.length),
    );

    return movie.episode.filter((episode) => episode.serverData.length === maxServerDataLength)[0];
}
