'use client';

import { PropsWithChildren } from 'react';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';

export default function NoAuthLayout({ children }: PropsWithChildren) {
    const router = useRouter();
    const { data, isLoading } = useIsAuthenticated();

    if (isLoading) {
        return <></>;
    }

    if (!isLoading && data?.authenticated) {
        return router.replace('/');
    }

    return <>{children}</>;
}
