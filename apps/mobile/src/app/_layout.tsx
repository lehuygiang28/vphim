import React from 'react';
import { Stack } from 'expo-router';
import { Platform, StatusBar } from 'react-native';
import { DataProvider, Refine } from '@refinedev/core';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

import { graphqlDataProvider, restfulDataProvider } from '~fe/providers/data-provider';
import { useAxiosAuth } from '~mb/hooks/useAxiosAuth';
import { ignoreExpoWaring } from '~mb/libs/utils';

if (__DEV__) {
    ignoreExpoWaring();
}

export default function AppLayout() {
    const axiosAuth = useAxiosAuth({ baseURL: process.env.EXPO_PUBLIC_BASE_API_URL });

    return (
        <Refine
            dataProvider={{
                default: restfulDataProvider(axiosAuth) as DataProvider,
                graphql: graphqlDataProvider(axiosAuth, {
                    publicApiUrl: process.env.EXPO_PUBLIC_BASE_API_URL,
                }) as DataProvider,
            }}
            resources={[
                {
                    name: 'movie',
                    list: '/movie',
                },
            ]}
            options={{
                reactQuery: {
                    devtoolConfig: Platform.OS === 'web' ? undefined : false,
                },
                disableTelemetry: true,
            }}
        >
            <ApplicationProvider {...eva} theme={eva.dark}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="search" options={{ headerShown: false }} />
                    <Stack.Screen name="movie/[slug]" options={{ headerShown: false }} />
                </Stack>
                <StatusBar barStyle="light-content" />
            </ApplicationProvider>
        </Refine>
    );
}
