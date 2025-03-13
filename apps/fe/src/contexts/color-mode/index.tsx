'use client';

import { customFont } from '@/fonts';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import type { ThemeConfig } from 'antd';
import { AliasToken } from 'antd/es/theme/internal';
import Cookies from 'js-cookie';
import React, { createContext, useEffect, useState, type PropsWithChildren } from 'react';

type ColorModeContextType = {
    mode: string;
    setMode: (mode: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>({} as ColorModeContextType);

type ColorModeContextProviderProps = {
    defaultMode?: string;
};

// Netflix-inspired theme tokens
// Note: These camelCase properties (e.g., colorBgBase) will be automatically converted to
// kebab-case CSS variables by Ant Design (e.g., --vphim-color-bg-base)
const netflixTheme: { dark: Partial<AliasToken>; light: Partial<AliasToken> } = {
    // Base tokens
    dark: {
        colorPrimary: '#E50914', // Netflix red
        colorSuccess: '#46D369', // Netflix green
        colorWarning: '#F5A623', // Warning orange
        colorError: '#E87C03', // Netflix error orange
        colorInfo: '#0073E6', // Info blue

        colorText: 'rgba(255, 255, 255, 0.95)', // Almost white text
        colorTextSecondary: 'rgba(255, 255, 255, 0.75)', // Secondary text
        colorTextTertiary: 'rgba(255, 255, 255, 0.45)', // Tertiary text
        colorTextQuaternary: 'rgba(255, 255, 255, 0.25)', // Quaternary text

        colorBgBase: '#141414', // Netflix background
        colorBgContainer: '#1A1A1A', // Container background
        colorBgElevated: '#2A2A2A', // Elevated container background
        colorBgLayout: '#141414', // Layout background
        colorBgSpotlight: '#222222', // Spotlight background

        colorBorder: 'rgba(255, 255, 255, 0.15)', // Border color
        colorBorderSecondary: 'rgba(255, 255, 255, 0.06)', // Secondary border

        // Component tokens
        controlHeight: 40, // Higher control height for better touch targets
        borderRadius: 4, // Netflix uses slightly rounded corners

        // Typography
        fontFamily: customFont.style.fontFamily,
        fontSize: 16, // Larger base font size

        // Animation
        motionDurationMid: '0.2s',
        motionEaseOut: 'cubic-bezier(0.33, 1, 0.68, 1)',

        // Other UI elements
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
        boxShadowSecondary: '0 6px 24px rgba(0, 0, 0, 0.8)',

        // Button specific
        controlItemBgActive: '#E50914', // Active button background
        controlItemBgHover: 'rgba(229, 9, 20, 0.8)', // Hover state
    },

    // Light theme (for completeness, though Netflix primarily uses dark)
    light: {
        colorPrimary: '#E50914', // Netflix red
        colorSuccess: '#2E7D32', // Success green
        colorWarning: '#ED6C02', // Warning orange
        colorError: '#D32F2F', // Error red
        colorInfo: '#0288D1', // Info blue

        colorText: 'rgba(0, 0, 0, 0.88)', // Primary text
        colorTextSecondary: 'rgba(0, 0, 0, 0.65)', // Secondary text
        colorTextTertiary: 'rgba(0, 0, 0, 0.45)', // Tertiary text
        colorTextQuaternary: 'rgba(0, 0, 0, 0.25)', // Quaternary text

        colorBgBase: '#FFFFFF', // Background
        colorBgContainer: '#FFFFFF', // Container background
        colorBgElevated: '#FFFFFF', // Elevated container background
        colorBgLayout: '#F5F5F5', // Layout background
        colorBgSpotlight: '#FAFAFA', // Spotlight background

        colorBorder: '#D9D9D9', // Border color
        colorBorderSecondary: '#F0F0F0', // Secondary border

        // Component tokens
        controlHeight: 40, // Higher control height for better touch targets
        borderRadius: 4, // Netflix uses slightly rounded corners

        // Typography
        fontFamily: customFont.style.fontFamily,
        fontSize: 16, // Larger base font size

        // Animation
        motionDurationMid: '0.2s',
        motionEaseOut: 'cubic-bezier(0.33, 1, 0.68, 1)',

        // Other UI elements
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.2)',

        // Button specific
        controlItemBgActive: '#E50914', // Active button background
        controlItemBgHover: 'rgba(229, 9, 20, 0.8)', // Hover state
    },
};

export const ColorModeContextProvider: React.FC<
    PropsWithChildren<ColorModeContextProviderProps>
> = ({ children, defaultMode }) => {
    const [isMounted, setIsMounted] = useState(false);
    const [mode, setMode] = useState(defaultMode || 'dark');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            const theme = Cookies.get('theme') || 'dark';
            setMode(theme);

            // Manually apply theme class to body for additional styling options
            if (theme === 'dark') {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
                document.documentElement.style.backgroundColor = '#141414';
                document.body.style.backgroundColor = '#141414';

                // Set CSS variables directly to ensure consistent styling
                document.documentElement.style.setProperty('--vphim-color-bg-base', '#141414');
                document.documentElement.style.setProperty(
                    '--vphim-color-text',
                    'rgba(255, 255, 255, 0.95)',
                );
                document.documentElement.style.setProperty(
                    '--vphim-color-text-secondary',
                    'rgba(255, 255, 255, 0.75)',
                );
                document.documentElement.style.setProperty('--vphim-color-primary', '#E50914');
                document.documentElement.style.setProperty(
                    '--vphim-color-border-secondary',
                    'rgba(255, 255, 255, 0.06)',
                );
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
                document.documentElement.style.backgroundColor = '#FFFFFF';
                document.body.style.backgroundColor = '#FFFFFF';

                // Set CSS variables directly to ensure consistent styling
                document.documentElement.style.setProperty('--vphim-color-bg-base', '#FFFFFF');
                document.documentElement.style.setProperty(
                    '--vphim-color-text',
                    'rgba(0, 0, 0, 0.88)',
                );
                document.documentElement.style.setProperty(
                    '--vphim-color-text-secondary',
                    'rgba(0, 0, 0, 0.65)',
                );
                document.documentElement.style.setProperty('--vphim-color-primary', '#E50914');
                document.documentElement.style.setProperty(
                    '--vphim-color-border-secondary',
                    '#F0F0F0',
                );
            }
        }
    }, [isMounted, mode]);

    const setColorMode = () => {
        if (mode === 'light') {
            setMode('dark');
            Cookies.set('theme', 'dark');
        } else {
            setMode('light');
            Cookies.set('theme', 'light');
        }
    };

    const { darkAlgorithm, defaultAlgorithm } = theme;

    // Netflix-inspired theme configuration
    const themeConfig: ThemeConfig = {
        algorithm: mode === 'dark' ? darkAlgorithm : defaultAlgorithm,
        token: mode === 'dark' ? netflixTheme.dark : netflixTheme.light,
        components: {
            Button: {
                colorPrimary: '#E50914',
                borderRadius: 4,
                controlHeight: 40,
                primaryShadow: 'none',
                defaultBorderColor: 'transparent',
                contentFontSizeSM: 14,
                contentFontSize: 16,
                contentFontSizeLG: 18,
            },
            Menu: {
                itemHeight: 48,
                itemHoverBg: 'rgba(229, 9, 20, 0.1)',
                itemSelectedBg: 'rgba(229, 9, 20, 0.2)',
                itemSelectedColor: '#E50914',
                horizontalItemSelectedColor: '#E50914',
                horizontalItemHoverColor: '#E50914',
                activeBarBorderWidth: 0,
                itemMarginInline: 8,
            },
            Card: {
                colorBorderSecondary: 'transparent',
                headerBg: 'transparent',
                actionsBg: 'transparent',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            },
            Table: {
                headerBg: 'rgba(0, 0, 0, 0.02)',
                headerSortActiveBg: 'rgba(0, 0, 0, 0.04)',
                rowHoverBg: 'rgba(229, 9, 20, 0.05)',
                headerSplitColor: 'transparent',
            },
            Input: {
                activeBorderColor: '#E50914',
                hoverBorderColor: 'rgba(229, 9, 20, 0.5)',
                activeShadow: '0 0 0 2px rgba(229, 9, 20, 0.2)',
            },
            Select: {
                optionSelectedBg: 'rgba(229, 9, 20, 0.1)',
                optionSelectedColor: '#E50914',
            },
            Modal: {
                contentBg: '#1A1A1A',
                headerBg: '#1A1A1A',
                titleColor: 'rgba(255, 255, 255, 0.95)',
                titleFontSize: 20,
                titleLineHeight: 1.4,
            },
            Drawer: {
                footerPaddingBlock: 16,
                footerPaddingInline: 24,
            },
            Tabs: {
                itemSelectedColor: '#E50914',
                itemHoverColor: 'rgba(229, 9, 20, 0.8)',
                inkBarColor: '#E50914',
            },
            Layout: {
                bodyBg: mode === 'dark' ? '#141414' : '#FFFFFF',
                headerBg: mode === 'dark' ? '#141414' : '#FFFFFF',
                siderBg: mode === 'dark' ? '#141414' : '#FFFFFF',
                footerBg: mode === 'dark' ? '#141414' : '#FFFFFF',
            },
        },
        cssVar: {
            prefix: 'vphim', // Custom prefix for CSS variables
        },
    };

    return (
        <ColorModeContext.Provider
            value={{
                setMode: setColorMode,
                mode,
            }}
        >
            <ConfigProvider theme={themeConfig}>
                <AntdApp>{children}</AntdApp>
            </ConfigProvider>
        </ColorModeContext.Provider>
    );
};
