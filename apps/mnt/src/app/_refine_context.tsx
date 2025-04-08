'use client';

import '@refinedev/antd/dist/reset.css';

import React from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { useNotificationProvider } from '@refinedev/antd';
import { DataProvider, Refine } from '@refinedev/core';
import routerProvider from '@refinedev/nextjs-router';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import {
    PlaySquareOutlined,
    DeleteFilled,
    UserOutlined,
    UnorderedListOutlined,
    TagOutlined,
    GlobalOutlined,
    VideoCameraOutlined,
    TeamOutlined,
} from '@ant-design/icons';

import { ColorModeContextProvider } from '~fe/contexts/color-mode';
import { graphqlDataProvider, restfulDataProvider } from '~fe/providers/data-provider';
import { useAxiosAuth } from '~fe/hooks/useAxiosAuth';
import { authProvider } from '~fe/providers/auth-provider';

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
    const axiosAuth = useAxiosAuth({ baseURL: process.env.NEXT_PUBLIC_API_URL });
    const { status } = useSession();

    if (status === 'loading') {
        return <></>;
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
                                default: restfulDataProvider(axiosAuth) as unknown as DataProvider,
                                graphql: graphqlDataProvider(axiosAuth) as unknown as DataProvider,
                            }}
                            notificationProvider={useNotificationProvider}
                            authProvider={authProvider(undefined, axiosAuth)}
                            resources={[
                                {
                                    name: 'dashboard',
                                    list: '/dashboard',
                                },
                                {
                                    name: 'movies',
                                    meta: {
                                        icon: <PlaySquareOutlined />,
                                        canDelete: true,
                                    },
                                },
                                {
                                    name: 'movie list',
                                    list: '/movies',
                                    create: '/movies/create',
                                    show: '/movies/show/:id',
                                    edit: '/movies/edit/:id',
                                    meta: {
                                        icon: <UnorderedListOutlined />,
                                        canDelete: true,
                                        parent: 'movies',
                                    },
                                },
                                {
                                    name: 'recycle-bin',
                                    list: '/recycle-bin',
                                    meta: {
                                        canDelete: true,
                                        icon: <DeleteFilled />,
                                        parent: 'movies',
                                    },
                                },
                                {
                                    name: 'categories',
                                    list: '/categories',
                                    edit: '/categories/edit/:id',
                                    show: '/categories/show/:id',
                                    meta: {
                                        icon: <TagOutlined />,
                                    },
                                },
                                {
                                    name: 'countries',
                                    list: '/countries',
                                    edit: '/countries/edit/:id',
                                    show: '/countries/show/:id',
                                    meta: {
                                        icon: <GlobalOutlined />,
                                    },
                                },
                                {
                                    name: 'directors',
                                    list: '/directors',
                                    edit: '/directors/edit/:id',
                                    show: '/directors/show/:id',
                                    meta: {
                                        icon: <VideoCameraOutlined />,
                                    },
                                },
                                {
                                    name: 'actors',
                                    list: '/actors',
                                    edit: '/actors/edit/:id',
                                    show: '/actors/show/:id',
                                    meta: {
                                        icon: <TeamOutlined />,
                                    },
                                },
                                {
                                    name: 'users',
                                    list: '/users',
                                    edit: '/users/edit/:id',
                                    show: '/users/show/:id',
                                    meta: {
                                        icon: <UserOutlined />,
                                    },
                                },
                            ]}
                            options={{
                                syncWithLocation: true,
                                warnWhenUnsavedChanges: true,
                                useNewQueryKeys: true,
                                projectId: 'NJcdqz-Mcj2uR-iCRTib',
                                disableTelemetry: true,
                            }}
                        >
                            {props.children}
                            <RefineKbar />
                        </Refine>
                    </ColorModeContextProvider>
                </AntdRegistry>
            </RefineKbarProvider>
        </>
    );
};
