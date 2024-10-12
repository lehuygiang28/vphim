'use client';

import { useForm } from '@refinedev/antd';
import { Create } from '@refinedev/antd';

import { CREATE_MOVIE } from '~mnt/queries/movie.query';
import { MovieType } from '~api/app/movies/movie.type';
import { MovieForm } from '~mnt/components/form/movie';
import { useFormLocalStorage } from '~mnt/hooks/useFormLocalStorage';

const STORAGE_KEY = 'vephim_movieCreateFormData';

export default function MovieCreatePage() {
    const { formProps, saveButtonProps, onFinish, form } = useForm<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        action: 'create',
        meta: {
            gqlQuery: CREATE_MOVIE,
            operation: 'createMovie',
        },
        redirect: 'list',
        invalidates: ['list', 'detail'],
    });

    const { ClearFormButton, handleValuesChange, handleFormFinish } = useFormLocalStorage({
        form,
        storageKey: STORAGE_KEY,
        onFinish,
    });

    return (
        <Create saveButtonProps={saveButtonProps} headerButtons={<ClearFormButton />}>
            <MovieForm
                formProps={{
                    ...formProps,
                    onFinish: handleFormFinish,
                    onValuesChange: handleValuesChange,
                }}
                mode="create"
            />
        </Create>
    );
}
