'use client';

import { PropsWithChildren } from 'react';
import { useIsAuthenticated } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { Layout } from 'antd';
import '@/components/layout/layout.css'; // Import global layout CSS

const { Content } = Layout;

export default function NoAuthLayout({ children }: PropsWithChildren) {
    const router = useRouter();
    const { data, isLoading } = useIsAuthenticated();

    if (isLoading) {
        return <></>;
    }

    if (!isLoading && data?.authenticated) {
        return router.replace('/');
    }

    return (
        <Layout className="auth-layout">
            <Content>{children}</Content>
        </Layout>
    );
}
