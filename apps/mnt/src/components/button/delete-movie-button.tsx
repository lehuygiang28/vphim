import { useRouter } from 'next/navigation';
import { useInvalidate } from '@refinedev/core';
import { DeleteButton, DeleteButtonProps } from '@refinedev/antd';

import { MUTATION_HARD_DELETE_MOVIE, MUTATION_UPDATE_MOVIE } from '~mnt/queries/movie.query';

export type DeleteMovieButtonProps = {
    id: string;
    type: 'soft-delete' | 'hard-delete';
    deleteButtonProps?: Omit<DeleteButtonProps, 'recordItemId'>;
    redirect?: {
        to: string;
        type?: 'push' | 'replace' | 'back';
    };
};

export function DeleteMovieButton({
    id,
    type,
    deleteButtonProps,
    redirect,
}: DeleteMovieButtonProps) {
    const router = useRouter();
    const invalidate = useInvalidate();

    return type === 'hard-delete' ? (
        <DeleteButton
            hideText
            size="small"
            recordItemId={id}
            confirmTitle="Bạn sẽ xóa vĩnh viễn bộ phim này. Hành động này không thể hoàn tác."
            confirmOkText="Có, xóa vĩnh viễn"
            confirmCancelText="Không, đừng xóa"
            resource="movies"
            dataProviderName="graphql"
            meta={{
                gqlMutation: MUTATION_HARD_DELETE_MOVIE,
                operation: 'mutateHardDeleteMovie',
                variables: {
                    input: {
                        _id: id,
                    },
                },
            }}
            invalidates={['list', 'detail']}
            onSuccess={async () => {
                await invalidate({
                    dataProviderName: 'graphql',
                    resource: 'movies',
                    invalidates: ['list', 'detail'],
                });
                if (redirect) {
                    if (redirect?.type === 'push') {
                        router.push(redirect.to);
                    } else if (redirect?.type === 'replace') {
                        router.replace(redirect.to);
                    } else if (redirect?.type === 'back') {
                        router.back();
                    }
                }
            }}
            {...deleteButtonProps}
        />
    ) : (
        <DeleteButton
            hideText
            size="small"
            recordItemId={id}
            confirmTitle="Bạn có chắc chắn muốn xóa bộ phim này?"
            confirmOkText="Có, xóa"
            confirmCancelText="Không, đừng xóa"
            resource="movies"
            dataProviderName="graphql"
            meta={{
                gqlMutation: MUTATION_UPDATE_MOVIE,
                operation: 'updateMovie',
                variables: {
                    input: {
                        _id: id,
                        deletedAt: 'delete',
                    },
                },
            }}
            invalidates={['list', 'detail']}
            onSuccess={async () => {
                await invalidate({
                    dataProviderName: 'graphql',
                    resource: 'movies',
                    invalidates: ['list', 'detail'],
                });
                if (redirect) {
                    if (redirect?.type === 'push') {
                        router.push(redirect.to);
                    } else {
                        router.replace(redirect.to);
                    }
                }
            }}
            {...deleteButtonProps}
        />
    );
}
