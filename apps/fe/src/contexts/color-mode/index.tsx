'use client';

import { customFont } from '@/fonts';
import { RefineThemes } from '@refinedev/antd';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
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
        }
    }, [isMounted]);

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

    return (
        <ColorModeContext.Provider
            value={{
                setMode: setColorMode,
                mode,
            }}
        >
            <ConfigProvider
                theme={{
                    ...RefineThemes.Purple,
                    algorithm: mode === 'dark' ? darkAlgorithm : defaultAlgorithm,
                    token: {
                        ...RefineThemes.Purple.token,
                        colorBgBase: 'rgba(17 19 25)',
                        fontFamily: customFont.style.fontFamily,
                    },
                }}
            >
                <AntdApp>{children}</AntdApp>
            </ConfigProvider>
        </ColorModeContext.Provider>
    );
};
