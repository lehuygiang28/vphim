'use client';

import { useCallback } from 'react';
import { Spin } from 'antd';
import { useForm } from '@refinedev/antd';
import { Edit } from '@refinedev/antd';

import { GET_FULL_MOVIE_DETAIL_QUERY, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';
import { MovieForm } from '~mnt/components/form/movie';
import { MovieType } from '~api/app/movies/movie.type';

export type EditMoviePageProps = {
    params: { slug: string };
};

export default function Component({ params }: EditMoviePageProps) {
    const { formProps, saveButtonProps, query, onFinish } = useForm<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: params.slug,
        action: 'edit',
        meta: {
            gqlQuery: GET_FULL_MOVIE_DETAIL_QUERY,
            gqlMutation: MUTATION_UPDATE_MOVIE,
            operation: 'movie',
            variables: {
                input: {
                    slug: params.slug,
                },
            },
        },
    });

    const handleOnfinish = useCallback(
        (values: MovieType) => {
            console.log(values);

            // Call onFinish with the prepared updateInput
            return onFinish({ input: { ...values, _id: query?.data?.data?._id } });
        },
        [onFinish],
    );

    if (query?.isLoading) {
        return <Spin fullscreen />;
    }

    return (
        <Edit saveButtonProps={saveButtonProps}>
            {query?.data?.data && (
                <MovieForm
                    actors={query?.data?.data?.actors || []}
                    categories={query?.data?.data?.categories || []}
                    countries={query?.data?.data?.countries || []}
                    directors={query?.data?.data?.directors || []}
                    formProps={formProps}
                    onFinish={handleOnfinish}
                />
            )}
        </Edit>
    );
}
