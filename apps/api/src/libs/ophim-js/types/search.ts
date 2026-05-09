import type { Movie } from './movie';
import type { OPhimResponseList } from './response-wrapper';

export type MovieInSearchResponse = Pick<
    Movie,
    | '_id'
    | 'origin_name'
    | 'name'
    | 'slug'
    | 'type'
    | 'thumb_url'
    | 'poster_url'
    | 'sub_docquyen'
    | 'is_copyright'
    | 'chieurap'
    | 'time'
    | 'episode_current'
    | 'quality'
    | 'lang'
    | 'year'
    | 'category'
    | 'country'
    | 'modified'
>;

export type SearchResponse = OPhimResponseList<MovieInSearchResponse>;
