import MovieList from '@/components/swiper/movie-list';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import { MovieAsset } from '@/types/movie-asset.type';
import { stringifyTableParams, useList } from '@refinedev/core';
import { MovieType } from 'apps/api/src/app/movies/movie.type';

export type MovieRelatedProps = {
    movie: MovieType;
};

export function MovieRelated({ movie }: MovieRelatedProps) {
    const asset: MovieAsset = {
        filters: [
            {
                field: 'categories',
                operator: 'in',
                value: movie?.categories?.map((item) => item.slug).join(','),
            },
            {
                field: 'type',
                operator: 'eq',
                value: movie?.type,
            },
        ],
        sorters: [
            {
                field: 'view',
                order: 'desc',
            },
        ],
    };

    const { data: movies, isLoading } = useList<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: { gqlQuery: MOVIES_LIST_QUERY, operation: 'movies' },
        pagination: {
            current: 1,
            pageSize: 12,
            mode: 'server',
        },
        ...asset,
    });

    return (
        <>
            <MovieList
                title="Phim liên quan"
                movies={movies?.data}
                isLoading={isLoading}
                viewMoreHref={`/danh-sach-phim?${stringifyTableParams(asset)}`}
                style={{
                    overflow: 'visible',
                }}
            />
        </>
    );
}
