'use client';

import { useNotificationProvider } from '@refinedev/antd';
import { DataProvider, Refine } from '@refinedev/core';
import { SessionProvider, useSession } from 'next-auth/react';
import React from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import routerProvider from '@refinedev/nextjs-router';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ColorModeContextProvider } from '@/contexts/color-mode';
import { graphqlDataProvider, restfulDataProvider } from '@/providers/data-provider';
import '@refinedev/antd/dist/reset.css';
import { useAxiosAuth } from '@/hooks/useAxiosAuth';
import { baseApiUrl } from '@/config';
import Loading from './loading';
import { authProvider } from '@/providers/auth-provider';

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
    const axiosAuth = useAxiosAuth({ baseURL: baseApiUrl });
    const { status } = useSession();

    if (status === 'loading') {
        return <Loading />;
    }

    return (
        <>
            <AntdRegistry>
                <ColorModeContextProvider defaultMode={'dark'}>
                    <Refine
                        routerProvider={routerProvider}
                        dataProvider={{
                            default: restfulDataProvider(axiosAuth) as DataProvider,
                            graphql: graphqlDataProvider(axiosAuth) as DataProvider,
                        }}
                        notificationProvider={useNotificationProvider}
                        authProvider={authProvider(undefined, axiosAuth)}
                        resources={[]}
                        options={{
                            syncWithLocation: true,
                            warnWhenUnsavedChanges: true,
                            useNewQueryKeys: true,
                            projectId: 'NJcdqz-Mcj2uR-iCRTib',
                        }}
                    >
                        {props.children}
                        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
                    </Refine>
                </ColorModeContextProvider>
            </AntdRegistry>
        </>
    );
};
