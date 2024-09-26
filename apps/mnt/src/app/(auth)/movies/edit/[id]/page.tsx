'use client';

import { Spin } from 'antd';
import { useForm, SaveButton } from '@refinedev/antd';
import { Edit } from '@refinedev/antd';

import { GET_FULL_MOVIE_DETAIL_QUERY, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';
import { MovieForm } from '~mnt/components/form/new-movie';
import { MovieType } from '~api/app/movies/movie.type';
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
        redirect: 'show',
        invalidates: ['list', 'detail'],
    });

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
            {query?.data?.data && <MovieForm query={query} formProps={formProps} />}
        </Edit>
    );
}
