import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme, MD3TypescaleKey } from 'react-native-paper';
import { Platform } from 'react-native';

type FontConfig = {
    [key in MD3TypescaleKey]: {
        fontFamily: string;
        fontSize: number;
        fontWeight:
            | 'normal'
            | 'bold'
            | '100'
            | '200'
            | '300'
            | '400'
            | '500'
            | '600'
            | '700'
            | '800'
            | '900';
        letterSpacing: number;
        lineHeight: number;
    };
};

const fontConfig: FontConfig = {
    displaySmall: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 36,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 44,
    },
    displayMedium: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 45,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 52,
    },
    displayLarge: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 57,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 64,
    },
    headlineSmall: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 24,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 32,
    },
    headlineMedium: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 28,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 36,
    },
    headlineLarge: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 32,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 40,
    },
    titleSmall: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif-medium',
        }),
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.1,
        lineHeight: 20,
    },
    titleMedium: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif-medium',
        }),
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 0.15,
        lineHeight: 24,
    },
    titleLarge: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 22,
        fontWeight: '400',
        letterSpacing: 0,
        lineHeight: 28,
    },
    labelSmall: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif-medium',
        }),
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.5,
        lineHeight: 16,
    },
    labelMedium: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif-medium',
        }),
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
        lineHeight: 16,
    },
    labelLarge: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif-medium',
        }),
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.1,
        lineHeight: 20,
    },
    bodySmall: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 12,
        fontWeight: '400',
        letterSpacing: 0.4,
        lineHeight: 16,
    },
    bodyMedium: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 14,
        fontWeight: '400',
        letterSpacing: 0.25,
        lineHeight: 20,
    },
    bodyLarge: {
        fontFamily: Platform.select({
            web: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
            ios: 'System',
            default: 'sans-serif',
        }),
        fontSize: 16,
        fontWeight: '400',
        letterSpacing: 0.15,
        lineHeight: 24,
    },
};

export const CustomDarkTheme: MD3Theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#642ab5',
        onPrimary: '#ffffff',
        primaryContainer: '#eaddff',
        onPrimaryContainer: '#21005d',
        secondary: '#9c27b0',
        onSecondary: '#ffffff',
        secondaryContainer: '#ffd6fa',
        onSecondaryContainer: '#3b0044',
        tertiary: '#7d5260',
        onTertiary: '#ffffff',
        tertiaryContainer: '#ffd8e4',
        onTertiaryContainer: '#31111d',
        error: '#ba1a1a',
        onError: '#ffffff',
        errorContainer: '#ffdad6',
        onErrorContainer: '#410002',
        background: '#1c1b1f',
        onBackground: '#e6e1e5',
        surface: '#1c1b1f',
        onSurface: '#e6e1e5',
        surfaceVariant: '#49454f',
        onSurfaceVariant: '#cac4d0',
        outline: '#938f99',
        outlineVariant: '#49454f',
        shadow: '#000000',
        scrim: '#000000',
        inverseSurface: '#e6e1e5',
        inverseOnSurface: '#313033',
        inversePrimary: '#642ab5',
        elevation: {
            level0: 'transparent',
            level1: '#27232a',
            level2: '#2d2a30',
            level3: '#332e37',
            level4: '#35303a',
            level5: '#39343e',
        },
        surfaceDisabled: 'rgba(230, 225, 229, 0.12)',
        onSurfaceDisabled: 'rgba(230, 225, 229, 0.38)',
        backdrop: 'rgba(50, 47, 55, 0.4)',
    },
    fonts: configureFonts({ config: fontConfig }),
    animation: {
        scale: 1.0,
    },
    roundness: 4,
    version: 3,
};

export type AppTheme = typeof CustomDarkTheme;
