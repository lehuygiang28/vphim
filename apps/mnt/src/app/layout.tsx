import React, { Suspense, PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { RefineContext } from './_refine_context';
import { defaultLocale } from '~mnt/i18n/config';

export const metadata: Metadata = {
    title: 'VePhim Admin',
    description: 'VePhim Admin',
    applicationName: 'VePhim Admin',
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

export default async function DefaultNoLayoutStyle({ children }: Readonly<PropsWithChildren>) {
    const cookieStore = cookies();
    const theme = cookieStore.get('theme');
    const defaultMode = theme?.value === 'light' ? 'light' : 'dark';

    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale ?? defaultLocale}>
            <body>
                <Suspense>
                    <NextIntlClientProvider messages={messages} locale={locale}>
                        <RefineContext defaultMode={defaultMode}>{children}</RefineContext>
                    </NextIntlClientProvider>
                </Suspense>
            </body>
        </html>
    );
}
