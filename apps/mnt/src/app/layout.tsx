import type { Metadata } from 'next';
// import { cookies } from 'next/headers';
import React, { Suspense, PropsWithChildren } from 'react';
import { RefineContext } from './_refine_context';

export const metadata: Metadata = {
    title: 'VePhim Quản Trị',
    description: 'VePhim Quản Trị',
    applicationName: 'VePhim Quản Trị',
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/favicon.ico',
        shortcut: '/favicon.ico',
    },
    manifest: '/site.webmanifest',
};

export default function DefaultNoLayoutStyle({ children }: Readonly<PropsWithChildren>) {
    // const cookieStore = cookies();
    // const theme = cookieStore.get('theme');
    // const defaultMode = theme?.value === 'light' ? 'light' : 'dark';

    return (
        <html lang="vi">
            <body>
                <Suspense>
                    <RefineContext defaultMode={'dark'}>
                        <>{children}</>
                    </RefineContext>
                </Suspense>
            </body>
        </html>
    );
}
