'use client';

import { useForm } from '@refinedev/antd';
import { Create } from '@refinedev/antd';

import { CREATE_MOVIE } from '~mnt/queries/movie.query';
import { MovieType } from '~api/app/movies/movie.type';
import { MovieForm } from '~mnt/components/form/new-movie';

export type EditMoviePageProps = {
    params: { slug: string };
};

export default function Component({ params }: EditMoviePageProps) {
    const { formProps, saveButtonProps } = useForm<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: params.slug,
        action: 'create',
        meta: {
            gqlQuery: CREATE_MOVIE,
            operation: 'createMovie',
        },
    });

    return (
        <Create saveButtonProps={saveButtonProps}>
            <MovieForm formProps={formProps} />
        </Create>
    );
}
