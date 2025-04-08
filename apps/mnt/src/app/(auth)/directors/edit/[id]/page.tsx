'use client';

import { Edit, useForm } from '@refinedev/antd';
import { type DirectorType } from '~api/app/directors/director.type';
import { PersonResourceForm } from '~mnt/components/form/resource/person-resource-form';
import { MNT_DIRECTOR_QUERY, MNT_DIRECTOR_UPDATE } from '~mnt/queries/director.query';

export type EditDirectorPageProps = {
    params: { id: string };
};

export default function EditDirector({ params }: EditDirectorPageProps) {
    const { formProps, saveButtonProps } = useForm<DirectorType>({
        dataProviderName: 'graphql',
        resource: 'directors',
        action: 'edit',
        meta: {
            gqlQuery: MNT_DIRECTOR_QUERY,
            gqlMutation: MNT_DIRECTOR_UPDATE,
            operation: 'director',
            variables: {
                input: {
                    _id: params.id,
                },
            },
        },
    });

    return (
        <Edit
            title={`Chỉnh sửa đạo diễn "${formProps.initialValues?.name}"`}
            saveButtonProps={saveButtonProps}
        >
            <PersonResourceForm
                formProps={formProps}
                gqlQuery={MNT_DIRECTOR_QUERY}
                type="edit"
                operation="director"
            />
        </Edit>
    );
}
