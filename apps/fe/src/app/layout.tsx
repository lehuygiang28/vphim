import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import React, { Suspense } from 'react';
import { RefineContext } from './_refine_context';
import Layout from '@/components/layout';

export const metadata: Metadata = {
    title: 'Refine',
    description: 'Generated by create refine app',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = cookies();
    const theme = cookieStore.get('theme');
    const defaultMode = theme?.value === 'light' ? 'light' : 'dark';

    return (
        <html lang="en">
            <body>
                <Suspense>
                    <RefineContext defaultMode={defaultMode}>
                        <Layout>{children}</Layout>
                    </RefineContext>
                </Suspense>
            </body>
        </html>
    );
}
