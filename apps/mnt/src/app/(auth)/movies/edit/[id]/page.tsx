'use client';

import { useCallback } from 'react';
import { Spin } from 'antd';
import { useForm, SaveButton } from '@refinedev/antd';
import { Edit } from '@refinedev/antd';

import { GET_FULL_MOVIE_DETAIL_QUERY, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';
import { MovieForm } from '~mnt/components/form/movie';
import { MovieType } from '~api/app/movies/movie.type';
import { DeleteMovieButton } from '~mnt/components/button/delete-movie-button';

export type EditMoviePageProps = {
    params: { id: string };
};

export default function MovieEditPage({ params }: EditMoviePageProps) {
    const { formProps, saveButtonProps, query, onFinish } = useForm<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: params.id,
        action: 'edit',
        meta: {
            gqlQuery: GET_FULL_MOVIE_DETAIL_QUERY,
            gqlMutation: MUTATION_UPDATE_MOVIE,
            operation: 'movie',
            variables: {
                input: {
                    id: params.id,
                },
            },
        },
        redirect: 'show',
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
        <Edit
            saveButtonProps={saveButtonProps}
            footerButtons={(button) => {
                const { saveButtonProps } = button;
                return (
                    <>
                        <SaveButton {...saveButtonProps} />
                        <DeleteMovieButton
                            id={params.id}
                            type="soft-delete"
                            deleteButtonProps={{
                                size: 'middle',
                                hideText: false,
                            }}
                            redirect={{
                                to: '/movies',
                                type: 'back',
                            }}
                        />
                    </>
                );
            }}
        >
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
