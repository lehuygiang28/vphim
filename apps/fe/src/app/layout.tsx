import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import React, { Suspense } from 'react';
import { RefineContext } from './_refine_context';

export const metadata: Metadata = {
    title: 'VePhim - Xem phim, phim hay theo thể loại, quốc gia, ...',
    description: 'VePhim - Xem phim, phim hay theo thể loại, quốc gia, ...',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function DefaultNoLayoutStyle({
    children,
    noauth,
    auth,
}: Readonly<{
    children: React.ReactNode;
    noauth: React.ReactNode;
    auth: React.ReactNode;
}>) {
    const cookieStore = cookies();
    const theme = cookieStore.get('theme');
    const defaultMode = theme?.value === 'light' ? 'light' : 'dark';

    return (
        <html lang="en">
            <body>
                <Suspense>
                    <RefineContext defaultMode={defaultMode}>
                        <>
                            {children}
                            {auth}
                            {noauth}
                        </>
                    </RefineContext>
                </Suspense>
            </body>
        </html>
    );
}
