import { ExpoConfig, ConfigContext } from 'expo/config';

// This file is used to see type definitions for the Expo config (app.json)
// Expo with NX will use file app.json for configuration
// NOT this file

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: 'VePhim',
    slug: 'vephim',
    scheme: 'vephim',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    newArchEnabled: false,
    splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    updates: {
        fallbackToCacheTimeout: 0,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
        supportsTablet: true,
        newArchEnabled: false,
    },
    android: {
        package: 'com.lehuygiang28.vephim',
        adaptiveIcon: {
            foregroundImage: './assets/adaptive-icon.png',
            backgroundColor: '#FFFFFF',
        },
        newArchEnabled: false,
    },
    web: {
        favicon: './assets/favicon.png',
        bundler: 'metro',
    },
    extra: {
        eas: {
            projectId: 'f36cda1c-8598-47b7-932e-9961be11128b',
        },
    },
    owner: 'lehuygiang28',
    plugins: [
        [
            'expo-secure-store',
            {
                faceIDPermission: 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.',
            },
        ],
        [
            'expo-build-properties',
            {
                android: {
                    newArchEnabled: false,
                },
                ios: {
                    newArchEnabled: false,
                },
            },
        ],
    ],
});
