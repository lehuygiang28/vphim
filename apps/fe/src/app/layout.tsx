import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { CopilotKit } from '@copilotkit/react-core';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import '@/styles/global.css';
import '@/components/layout/layout.css';
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
        'nguồn phim',
    ],
    authors: [{ name: 'VePhim Team' }],
    creator: 'VePhim',
    publisher: 'VePhim',
    applicationName: 'VePhim',
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
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
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
    manifest: '/site.webmanifest',
};

export default async function DefaultNoLayoutStyle({
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

    const locale = await getLocale();
    // Providing all messages to the client side is the easiest way to get started
    const messages = await getMessages();

    return (
        <html lang={locale ?? 'en'} className={customFont.className}>
            <head>
                <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
                <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />

                <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_IMAGES_URL} />
                <link rel="preconnect" href={process.env.NEXT_PUBLIC_IMAGES_URL} />

                <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_STREAM_PROXY_URL} />
                <link rel="preconnect" href={process.env.NEXT_PUBLIC_STREAM_PROXY_URL} />

                {process.env.DNS_PREFETCH_URLS &&
                    process.env.DNS_PREFETCH_URLS.split(',').map((url) => (
                        <React.Fragment key={url}>
                            <link rel="dns-prefetch" href={url} />
                            <link rel="preconnect" href={url} />
                        </React.Fragment>
                    ))}
            </head>
            <body>
                <AntdRegistry ssrInline defaultCache>
                    <Suspense>
                        <CopilotKit
                            runtimeUrl={`${process.env.NEXT_PUBLIC_API_URL}/api/copilotkit`}
                        >
                            <NextIntlClientProvider messages={messages} locale={locale}>
                                <RefineContext defaultMode={defaultMode}>
                                    {children}
                                    {auth}
                                    {noauth}
                                </RefineContext>
                            </NextIntlClientProvider>
                        </CopilotKit>
                    </Suspense>
                </AntdRegistry>
                <Analytics />
                <SpeedInsights />
                <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ?? ''} />
            </body>
        </html>
    );
}
