'use client';

import { PropsWithChildren } from 'react';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import LoadingPage from '../loading';

export default function RequiredAuthLayout({ children }: PropsWithChildren) {
    const router = useRouter();
    const { data, isLoading } = useIsAuthenticated();

    if (isLoading) {
        return <LoadingPage />;
    }

    if (!isLoading && !data?.authenticated) {
        return router.replace('/');
    }

    return <>{children}</>;
}
