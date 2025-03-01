'use client';

import '@refinedev/antd/dist/reset.css';

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useNotificationProvider } from '@refinedev/antd';
import { DataProvider, Refine, I18nProvider } from '@refinedev/core';
import { SessionProvider, useSession } from 'next-auth/react';
import routerProvider from '@refinedev/nextjs-router';
import { TranslationValues, useLocale, useTranslations } from 'next-intl';

import { ColorModeContextProvider } from '@/contexts/color-mode';
import { graphqlDataProvider } from '@/providers/data-provider';
import { useAxiosAuth } from '@/hooks/useAxiosAuth';
import { authProvider } from '@/providers/auth-provider';
import { useAxios } from '@/hooks/useAxios';
import Loading from './loading';
import { setUserLocale } from '@/services/locale';
import { Locale } from '@/i18n/config';

type RefineContextProps = {
    defaultMode?: string;
};

export const RefineContext = (props: React.PropsWithChildren<RefineContextProps>) => {
    return (
        <SessionProvider>
            <App {...props} />
        </SessionProvider>
    );
};

type AppProps = {
    defaultMode?: string;
};

const App = (props: React.PropsWithChildren<AppProps>) => {
    const router = useRouter();
    const params = useParams();

    const { status } = useSession();
    const { instance: axios } = useAxios({ baseURL: process.env.NEXT_PUBLIC_API_URL });
    const axiosAuth = useAxiosAuth({ baseURL: process.env.NEXT_PUBLIC_API_URL });
    const gqlProvider = useMemo(() => graphqlDataProvider(axiosAuth), [axiosAuth]);

    const t = useTranslations('refineUI');
    const locale = useLocale();

    const i18nProvider: I18nProvider = {
        translate: (key: string, params: TranslationValues) => t(key, params),
        changeLocale: (lang: string) => {
            router.replace(
                // @ts-expect-error -- TypeScript will validate that only known `params`
                // are used in combination with a given `pathname`. Since the two will
                // always match for the current route, we can skip runtime checks.
                { pathname, params },
                { locale: lang },
            );
            return setUserLocale(lang as Locale);
        },
        getLocale: () => locale,
    };

    if (status === 'loading') {
        return <Loading />;
    }

    return (
        <>
            <ColorModeContextProvider defaultMode={'dark'}>
                <Refine
                    routerProvider={routerProvider}
                    dataProvider={{
                        default: gqlProvider as unknown as DataProvider,
                        graphql: gqlProvider as unknown as DataProvider,
                    }}
                    notificationProvider={useNotificationProvider}
                    authProvider={authProvider(axios, axiosAuth)}
                    resources={[]}
                    options={{
                        syncWithLocation: true,
                        warnWhenUnsavedChanges: true,
                        useNewQueryKeys: true,
                        projectId: 'NJcdqz-Mcj2uR-iCRTib',
                        disableTelemetry: true,
                    }}
                    i18nProvider={i18nProvider}
                >
                    {props.children}
                </Refine>
            </ColorModeContextProvider>
        </>
    );
};
