import type { Movie } from './movie';

export type Region = {
    _id: string;
    name: string;
    slug: string;
    seo_title?: string;
    seo_des?: string;
    seo_key?: string;
    created_at?: string;
    updated_at?: string;
    movies?: Movie[];
};
