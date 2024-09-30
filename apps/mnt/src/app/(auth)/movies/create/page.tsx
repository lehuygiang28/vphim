'use client';

import { useForm } from '@refinedev/antd';
import { Create } from '@refinedev/antd';

import { CREATE_MOVIE } from '~mnt/queries/movie.query';
import { MovieType } from '~api/app/movies/movie.type';
import { MovieForm } from '~mnt/components/form/movie';

export default function MovieCreatePage() {
    const { formProps, saveButtonProps } = useForm<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: '',
        action: 'create',
        meta: {
            gqlQuery: CREATE_MOVIE,
            operation: 'createMovie',
        },
        redirect: 'list',
        invalidates: ['list', 'detail'],
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <MovieForm formProps={formProps} mode="create" />
        </Create>
    );
}
