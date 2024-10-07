import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { RefineContext } from './_refine_context';
import { customFont } from '@/fonts';

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
        <html lang="en" className={customFont.className}>
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
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
