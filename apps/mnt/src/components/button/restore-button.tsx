'use client';

import { RollbackOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { UpdateParams, useInvalidate, useUpdate } from '@refinedev/core';
import { Button, Popconfirm } from 'antd';

export type RestoreButtonProps = {
    mutateParam: UpdateParams;
    name?: string;
    dataProviderName?: string;
    resource?: string;
};

export function RestoreButton({
    mutateParam,
    name = 'movie',
    dataProviderName = 'graphql',
    resource = 'movies',
}: RestoreButtonProps) {
    const { mutate: mutateRestore, isLoading: restoreLoading } = useUpdate({
        dataProviderName,
        resource: 'movies',
        id: mutateParam.id,
    });
    const invalidate = useInvalidate();

    return (
        <>
            <Popconfirm
                key={`restore-popconfirm-${mutateParam.id}`}
                okText="Có, khôi phục"
                cancelText="Không, đừng khôi phục"
                icon={<InfoCircleOutlined style={{ color: 'green' }} />}
                title={`Bạn có chắc chắn muốn khôi phục ${
                    name === 'movie' ? 'bộ phim' : name
                } này?`}
                onConfirm={async () => {
                    mutateRestore({
                        ...mutateParam,
                        dataProviderName,
                        resource,
                        id: mutateParam.id,
                        meta: mutateParam?.meta,
                        values: {},
                    });
                    return invalidate({
                        resource: 'movies',
                        invalidates: ['all'],
                    });
                }}
            >
                <Button
                    key={`restore_${mutateParam.id}`}
                    size="small"
                    type="default"
                    icon={<RollbackOutlined style={{ color: 'green' }} />}
                    loading={restoreLoading}
                />
            </Popconfirm>
        </>
    );
}
