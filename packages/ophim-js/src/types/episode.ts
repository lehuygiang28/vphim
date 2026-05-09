import type { Movie } from './movie';

export type Episode = {
    _id: string;
    name: string;
    slug: string;
    type: string;
    link: string;
    server: number;
    movie__id: string;
    created_at: string;
    updated_at: string;
    movie?: Movie;
};
