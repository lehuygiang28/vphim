'use client';

import { useForm } from '@refinedev/antd';
import { Edit } from '@refinedev/antd';

import Loading from '~mnt/app/loading';
import { GET_FULL_MOVIE_DETAIL_QUERY } from '~mnt/queries/movie.query';
import { MovieForm } from '~mnt/components/form/movie';
import { MovieType } from '~api/app/movies/movie.type';

export type EditMoviePageProps = {
    params: { slug: string };
};

export default function Component({ params }: EditMoviePageProps) {
    const { formProps, saveButtonProps, query } = useForm<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: params.slug,
        action: 'edit',
        meta: {
            gqlQuery: GET_FULL_MOVIE_DETAIL_QUERY,
            operation: 'movie',
            variables: {
                input: {
                    slug: params.slug,
                },
            },
        },
    });

    if (query?.isLoading) {
        return <Loading />;
    }

    return (
        <Edit saveButtonProps={saveButtonProps}>
            {query?.data?.data && (
                <MovieForm
                    actors={query?.data?.data?.actors || []}
                    categories={query?.data?.data?.categories || []}
                    formProps={formProps}
                />
            )}
        </Edit>
    );
}
