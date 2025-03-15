import React from 'react';
import { StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import * as eva from '@eva-design/eva';
import { ApplicationProvider } from '@ui-kitten/components';

import RefineContextProvider from './_refine_context';

// Netflix-inspired theme based on frontend theme
const netflixTheme: Record<keyof typeof eva.dark, string | number> = {
    'color-primary-100': '#FFECEE',
    'color-primary-200': '#FFD0D4',
    'color-primary-300': '#FFA2A9',
    'color-primary-400': '#FF747D',
    'color-primary-500': '#E50914', // Netflix red
    'color-primary-600': '#C20812',
    'color-primary-700': '#9F060E',
    'color-primary-800': '#7C040A',
    'color-primary-900': '#650307',

    'color-success-100': '#EDFCD1',
    'color-success-200': '#D8F9A3',
    'color-success-300': '#BBED75',
    'color-success-400': '#9FDA51',
    'color-success-500': '#46D369', // Netflix green
    'color-success-600': '#4EB657',
    'color-success-700': '#389945',
    'color-success-800': '#277C33',
    'color-success-900': '#1B6727',

    'color-info-100': '#D6EFFF',
    'color-info-200': '#ADDDFF',
    'color-info-300': '#84C7FF',
    'color-info-400': '#62B1FF',
    'color-info-500': '#0073E6', // Netflix info blue
    'color-info-600': '#0059B8',
    'color-info-700': '#00448A',
    'color-info-800': '#002F5C',
    'color-info-900': '#00203A',

    'color-warning-100': '#FFF5D6',
    'color-warning-200': '#FFE8AD',
    'color-warning-300': '#FFD884',
    'color-warning-400': '#FFC866',
    'color-warning-500': '#F5A623', // Netflix warning orange
    'color-warning-600': '#CC8519',
    'color-warning-700': '#A36612',
    'color-warning-800': '#7A4A0C',
    'color-warning-900': '#5C3707',

    'color-danger-100': '#FFE9D9',
    'color-danger-200': '#FFCEB3',
    'color-danger-300': '#FFB28D',
    'color-danger-400': '#FF9570',
    'color-danger-500': '#E87C03', // Netflix error orange
    'color-danger-600': '#BF6102',
    'color-danger-700': '#964A02',
    'color-danger-800': '#6D3501',
    'color-danger-900': '#4F2501',

    // Dark theme backgrounds and text
    'background-basic-color-1': '#141414', // Netflix background
    'background-basic-color-2': '#1A1A1A', // Container background
    'background-basic-color-3': '#2A2A2A', // Elevated container background
    'background-basic-color-4': '#222222', // Spotlight background

    'text-basic-color': 'rgba(255, 255, 255, 0.95)', // Primary text
    'text-alternate-color': '#141414',
    'text-control-color': '#ffffff',
    'text-disabled-color': 'rgba(255, 255, 255, 0.25)',
    'text-hint-color': 'rgba(255, 255, 255, 0.45)',

    'border-basic-color-1': 'rgba(255, 255, 255, 0.15)',
    'border-basic-color-2': 'rgba(255, 255, 255, 0.15)',
    'border-basic-color-3': 'rgba(255, 255, 255, 0.15)',
    'border-basic-color-4': 'rgba(255, 255, 255, 0.15)',
    'border-basic-color-5': 'rgba(255, 255, 255, 0.15)',

    'border-alternative-color-1': 'rgba(255, 255, 255, 0.06)',
    'border-alternative-color-2': 'rgba(255, 255, 255, 0.06)',
    'border-alternative-color-3': 'rgba(255, 255, 255, 0.06)',
    'border-alternative-color-4': 'rgba(255, 255, 255, 0.06)',
    'border-alternative-color-5': 'rgba(255, 255, 255, 0.06)',

    // Other UI elements
    shadow: '0 4px 16px rgba(0, 0, 0, 0.6)',

    // Button specific
    'button-border-radius': 4,
    'button-large-min-height': 48,
    'button-medium-min-height': 40,
    'button-small-min-height': 32,
    'button-tiny-min-height': 24,
};

export default function AppLayout() {
    return (
        <RefineContextProvider>
            <ApplicationProvider {...eva} theme={{ ...eva.dark, ...netflixTheme }}>
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
