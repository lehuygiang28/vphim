'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useNotificationProvider } from '@refinedev/antd';
import { DataProvider, Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '@refinedev/antd/dist/reset.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { PlaySquareOutlined } from '@ant-design/icons';

import { ColorModeContextProvider } from '~fe/contexts/color-mode';
import { graphqlDataProvider, restfulDataProvider } from '~fe/providers/data-provider';
import { useAxiosAuth } from '~fe/hooks/useAxiosAuth';
import { baseApiUrl } from '~fe/config';
import { authProvider } from '~fe/providers/auth-provider';

import Loading from './loading';

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

    const defaultMode = props?.defaultMode;

    return (
        <>
            <RefineKbarProvider>
                <AntdRegistry>
                    <ColorModeContextProvider defaultMode={defaultMode}>
                        <Refine
                            routerProvider={routerProvider}
                            dataProvider={{
                                default: { ...restfulDataProvider(axiosAuth) } as DataProvider,
                                graphql: graphqlDataProvider(axiosAuth) as DataProvider,
                            }}
                            notificationProvider={useNotificationProvider}
                            authProvider={authProvider(undefined, axiosAuth)}
                            resources={[
                                {
                                    name: 'movies',
                                    list: '/movies',
                                    create: '/movies/create',
                                    show: '/movies/show/:id',
                                    edit: '/movies/edit/:id',
                                    meta: {
                                        icon: <PlaySquareOutlined />,
                                        canDelete: true,
                                    },
                                },
                            ]}
                            options={{
                                syncWithLocation: true,
                                warnWhenUnsavedChanges: true,
                                useNewQueryKeys: true,
                            }}
                        >
                            {props.children}
                            <ReactQueryDevtools
                                initialIsOpen={false}
                                buttonPosition="bottom-left"
                            />
                            <RefineKbar />
                        </Refine>
                    </ColorModeContextProvider>
                </AntdRegistry>
            </RefineKbarProvider>
        </>
    );
};