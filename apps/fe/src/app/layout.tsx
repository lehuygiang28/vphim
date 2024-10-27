import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { RefineContext } from './_refine_context';
import { customFont } from '@/fonts';

export const metadata: Metadata = {
    title: {
        default: 'VePhim - Xem phim miễn phí, cập nhật phim mới hàng ngày, chất lượng cao',
        template: '%s | VePhim',
    },
    description:
        'VePhim - Trang web xem phim miễn phí với đa dạng thể loại và quốc gia. Cập nhật phim mới hàng ngày, chất lượng cao, phụ đề đầy đủ.',
    keywords: [
        'xem phim',
        'phim miễn phí',
        'phim online',
        'phim hay',
        'VePhim',
        'vê phim',
        'ophim',
        'kkphim',
        'nguonc',
        'nguồn phim',
    ],
    authors: [{ name: 'VePhim Team' }],
    creator: 'VePhim',
    publisher: 'VePhim',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL('https://vephim.online/'),
    alternates: {
        canonical: '/',
        languages: {
            'vi-VN': '/',
        },
    },
    openGraph: {
        title: 'VePhim - Xem phim miễn phí, cập nhật phim mới hàng ngày, chất lượng cao',
        description:
            'VePhim - Trang web xem phim miễn phí với đa dạng thể loại và quốc gia. Cập nhật phim mới hàng ngày, chất lượng cao, phụ đề đầy đủ.',
        url: 'https://vephim.online/',
        siteName: 'VePhim',
        images: [
            {
                url: '/assets/images/og-image-1200x630.webp',
                width: 1200,
                height: 630,
                alt: 'VePhim - Xem phim miễn phí, cập nhật phim mới hàng ngày, chất lượng cao',
            },
            {
                url: '/assets/images/og-image-1920x1080.webp',
                width: 1920,
                height: 1080,
                alt: 'VePhim - Xem phim miễn phí, cập nhật phim mới hàng ngày, chất lượng cao',
            },
        ],
        locale: 'vi_VN',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    twitter: {
        card: 'summary_large_image',
        title: 'VePhim - Xem phim miễn phí, cập nhật phim mới hàng ngày, chất lượng cao',
        description:
            'VePhim - Trang web xem phim miễn phí với đa dạng thể loại và quốc gia. Cập nhật phim mới hàng ngày, chất lượng cao, phụ đề đầy đủ.',
        images: [
            {
                url: '/assets/images/og-image-1200x630.webp',
                width: 1200,
                height: 630,
                alt: 'VePhim - Xem phim miễn phí, cập nhật phim mới hàng ngày, chất lượng cao',
            },
            {
                url: '/assets/images/og-image-1920x1080.webp',
                width: 1920,
                height: 1080,
                alt: 'VePhim - Xem phim miễn phí, cập nhật phim mới hàng ngày, chất lượng cao',
            },
        ],
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/favicon.ico',
        shortcut: '/favicon.ico',
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
            <head>
                <link rel="dns-prefetch" href={'https://api.themoviedb.org'} />
                <link rel="preconnect" href={'https://api.themoviedb.org'} />

                <link rel="dns-prefetch" href={'https://data.ratings.media-imdb.com'} />
                <link rel="preconnect" href={'https://data.ratings.media-imdb.com'} />
            </head>
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
