import React from 'react';
import { Button } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { useRefreshButton, useInvalidate, useResource } from '@refinedev/core';
import { RefineButtonClassNames, RefineButtonTestIds } from '@refinedev/ui-types';
import { RefreshButtonProps } from '@refinedev/antd';
import { useAxios } from '@/hooks/useAxios';

export const RefreshMovieButton: React.FC<RefreshButtonProps> = ({
    resource: resourceNameFromProps,
    resourceNameOrRouteName: propResourceNameOrRouteName,
    recordItemId,
    hideText = false,
    dataProviderName,
    children,
    meta: _meta,
    metaData: _metaData,
    ...rest
}) => {
    const axios = useAxios({ baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api` });
    const invalidate = useInvalidate();
    const { resource } = useResource();

    const {
        onClick: originalOnClick,
        label,
        loading: originalLoading,
    } = useRefreshButton({
        resource: resourceNameFromProps ?? propResourceNameOrRouteName,
        id: recordItemId ?? '',
        dataProviderName,
    });

    const [loading, setLoading] = React.useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            await axios.request({ method: 'post', url: '/movies/soft-refresh' });

            if (recordItemId) {
                // If recordItemId is provided, use the original Refine behavior
                await originalOnClick();
            } else {
                // If no recordItemId, invalidate the list
                await invalidate({
                    resource: resourceNameFromProps ?? propResourceNameOrRouteName ?? resource.name,
                    invalidates: ['list'],
                    dataProviderName,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleClick}
            icon={<RedoOutlined spin={loading || originalLoading} />}
            data-testid={RefineButtonTestIds.RefreshButton}
            className={RefineButtonClassNames.RefreshButton}
            {...rest}
        >
            {!hideText && (children ?? label)}
        </Button>
    );
};
