'use client';

import React from 'react';
import { Spin } from 'antd';
import { useForm, SaveButton } from '@refinedev/antd';
import { Edit } from '@refinedev/antd';

import { MovieType } from '~api/app/movies/movie.type';

import { GET_FULL_MOVIE_DETAIL_QUERY, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';
import { MovieForm } from '~mnt/components/form/movie';
import { DeleteMovieButton } from '~mnt/components/button/delete-movie-button';

export type EditMoviePageProps = {
    params: { id: string };
};

export default function MovieEditPage({ params }: EditMoviePageProps) {
    const { formProps, saveButtonProps, query } = useForm<MovieType>({
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
                    _id: params.id,
                },
            },
        },
        invalidates: ['list', 'detail'],
    });

    if (query?.isLoading) {
        return <Spin fullscreen />;
    }

    return (
        <Edit
            title={`Edit ${query?.data?.data?.originName}`}
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
            {query?.data?.data && <MovieForm query={query} formProps={formProps} mode="edit" />}
        </Edit>
    );
}
