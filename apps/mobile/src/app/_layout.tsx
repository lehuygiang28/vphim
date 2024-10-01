import React from 'react';
import { Tabs, Stack } from 'expo-router';
import { Platform, StatusBar } from 'react-native';
import { DataProvider, Refine } from '@refinedev/core';
import { Provider as PaperProvider } from 'react-native-paper';
import { ReactNavigationThemeProvider } from '@refinenative/react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import { graphqlDataProvider, restfulDataProvider } from '~fe/providers/data-provider';
import { CustomDarkTheme } from '~mb/config/theme';
import { useAxiosAuth } from '../hooks/useAxiosAuth';
import AppHeader from '../components/app-header';

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
                    name: 'movies',
                    list: '/movies',
                },
            ]}
            options={{
                reactQuery: {
                    devtoolConfig: Platform.OS === 'web' ? undefined : false,
                },
                disableTelemetry: true,
            }}
        >
            <ReactNavigationThemeProvider theme={CustomDarkTheme}>
                <PaperProvider theme={CustomDarkTheme}>
                    <Stack>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="movie/[slug]" options={{ title: 'Movie Details' }} />
                    </Stack>
                    <StatusBar barStyle="light-content" />
                </PaperProvider>
            </ReactNavigationThemeProvider>
        </Refine>
    );
}
