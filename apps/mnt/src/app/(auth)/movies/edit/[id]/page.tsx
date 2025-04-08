'use client';

import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { useForm, SaveButton } from '@refinedev/antd';
import { Edit } from '@refinedev/antd';

import { type MovieType } from '~api/app/movies/movie.type';
import { type ActorType } from '~api/app/actors/actor.type';
import { type RegionType } from '~api/app/regions/region.type';
import { type DirectorType } from '~api/app/directors/director.type';
import { type CategoryType } from '~api/app/categories/category.type';

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
    const movie = query?.data?.data;

    useEffect(() => {
        const formData = {
            actors: Array.isArray(movie?.actors)
                ? movie.actors.map((actor: ActorType) =>
                      typeof actor === 'object' && actor._id ? actor?._id?.toString() : actor,
                  )
                : [],
            categories: Array.isArray(movie?.categories)
                ? movie.categories.map((category: CategoryType) =>
                      typeof category === 'object' && category._id
                          ? category?._id?.toString()
                          : category,
                  )
                : [],
            countries: Array.isArray(movie?.countries)
                ? movie.countries.map((country: RegionType) =>
                      typeof country === 'object' && country._id
                          ? country?._id?.toString()
                          : country,
                  )
                : [],
            directors: Array.isArray(movie?.directors)
                ? movie.directors.map((director: DirectorType) =>
                      typeof director === 'object' && director._id
                          ? director?._id?.toString()
                          : director,
                  )
                : [],
        };
        Object.entries(formData).forEach(([key, value]) => {
            if (value) {
                formProps?.form.setFieldsValue({ [key]: value });
            }
        });
    }, [movie, formProps?.form]);

    if (query?.isLoading) {
        return <Spin fullscreen />;
    }

    return (
        <Edit
            title={`Chỉnh sửa phim "${movie?.originName}"`}
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
            {movie && <MovieForm query={query} formProps={formProps} mode="edit" />}
        </Edit>
    );
}
