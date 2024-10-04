import type { EpisodeType, MovieType } from 'apps/api/src/app/movies/movie.type';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';

dayjs.extend(tz);
dayjs.extend(utc);

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

export const removeLeadingTrailingSlashes = (route: string) => {
    return route.replace(/^\/|\/$/g, '');
};

export function canParseToNumber(value: string): boolean {
    return !isNaN(Number(value?.trim()));
}

export function formatDateToHumanReadable(
    date: Date | string,
    { timezone, ms }: { timezone?: string; ms?: boolean } = { ms: false, timezone: null },
) {
    const format = ms ? 'HH:mm:ss:SSS DD/MM/YYYY' : 'HH:mm DD/M/YY';
    return timezone ? dayjs(date).tz(timezone).format(format) : dayjs(date).format(format);
}

export function isProduction() {
    return process.env.NODE_ENV === 'production';
}
