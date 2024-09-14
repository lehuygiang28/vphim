'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { CSSProperties } from 'react';
import { Layout } from 'antd';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { vietnameseLayoutTranslations } from './translate';

const { Content } = Layout;

export type PlayerPageProps = {
    params: {
        m3u8: string;
    };
    searchParams: {
        poster?: string;
        lang?: string;
        name?: string;
    };
};

const containerStyle: CSSProperties = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'black',
    overflow: 'hidden',
    borderRadius: 0,
};

const playerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    maxWidth: '1920px',
    maxHeight: '1080px',
    aspectRatio: '16 / 9',
    background: 'black',
    border: 'none',
    borderRadius: 0,
};

export default function PlayerPage({ params, searchParams }: PlayerPageProps) {
    return (
        <Layout style={containerStyle}>
            <Content>
                <MediaPlayer
                    title={searchParams?.name || 'VePhim'}
                    src={decodeURIComponent(params.m3u8)}
                    playsInline
                    style={{ ...playerStyle }}
                >
                    <MediaProvider></MediaProvider>
                    <DefaultVideoLayout
                        icons={defaultLayoutIcons}
                        translations={
                            searchParams?.lang === 'en' ? undefined : vietnameseLayoutTranslations
                        }
                        title={searchParams?.name || 'VePhim'}
                    />
                </MediaPlayer>
            </Content>
        </Layout>
    );
}
