'use client';

import { PropsWithChildren } from 'react';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import '@/components/layout/layout.css';

export default function RequiredAuthLayout({ children }: PropsWithChildren) {
    const router = useRouter();
    const { data, isLoading } = useIsAuthenticated();

    if (isLoading) {
        return <></>;
    }

    if (!isLoading && !data?.authenticated) {
        signOut({ redirect: false });
        return router.replace('/');
    }

    return <div className="layout-space-container">{children}</div>;
}
