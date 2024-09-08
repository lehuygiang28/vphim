'use client';

import { useNotificationProvider } from '@refinedev/antd';
import { DataProvider, Refine, type AuthProvider } from '@refinedev/core';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import React from 'react';

import routerProvider from '@refinedev/nextjs-router';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ColorModeContextProvider } from '@/contexts/color-mode';
import { graphqlDataProvider, restfulDataProvider } from '@/providers/data-provider';
import '@refinedev/antd/dist/reset.css';
import { useAxiosAuth } from '@/hooks/useAxiosAuth';
import { baseApiUrl } from '@/config';
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
    const { data, status } = useSession();
    const to = usePathname();

    if (status === 'loading') {
        return <Loading />;
    }

    const authProvider: AuthProvider = {
        login: async () => {
            signIn('google', {
                callbackUrl: to ? to.toString() : '/',
                redirect: true,
            });

            return {
                success: true,
            };
        },
        logout: async () => {
            signOut({
                redirect: true,
                callbackUrl: '/login',
            });

            return {
                success: true,
            };
        },
        onError: async (error) => {
            if (error.response?.status === 401) {
                return {
                    logout: true,
                };
            }

            return {
                error,
            };
        },
        check: async () => {
            if (status === 'unauthenticated') {
                return {
                    authenticated: false,
                    redirectTo: '/login',
                };
            }

            return {
                authenticated: true,
            };
        },
        getPermissions: async () => {
            return null;
        },
        getIdentity: async () => {
            if (data?.user) {
                const { user } = data;
                return {
                    name: user.fullName,
                    avatar: user?.avatar,
                };
            }

            return null;
        },
    };

    const defaultMode = props?.defaultMode;

    return (
        <>
            <AntdRegistry>
                <ColorModeContextProvider defaultMode={defaultMode}>
                    <Refine
                        routerProvider={routerProvider}
                        dataProvider={{
                            default: { ...restfulDataProvider(axiosAuth) } as DataProvider,
                            graphql: graphqlDataProvider(axiosAuth) as DataProvider,
                        }}
                        notificationProvider={useNotificationProvider}
                        authProvider={authProvider}
                        resources={[]}
                        options={{
                            syncWithLocation: true,
                            warnWhenUnsavedChanges: true,
                            useNewQueryKeys: true,
                        }}
                    >
                        {props.children}
                    </Refine>
                </ColorModeContextProvider>
            </AntdRegistry>
        </>
    );
};
