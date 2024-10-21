import React from 'react';
import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

import RefineContextProvider from './_refine_context';

export default function AppLayout() {
    return (
        <RefineContextProvider>
            <ApplicationProvider {...eva} theme={eva.dark}>
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="search" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="movie/[slug]" options={{ headerShown: false }} />
                </Stack>
                <StatusBar barStyle="light-content" />
            </ApplicationProvider>
        </RefineContextProvider>
    );
}
