'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { CSSProperties, useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Layout } from 'antd';
import {
    MediaPlayer,
    MediaPlayerInstance,
    MediaProvider,
    Poster,
    useMediaStore,
    ChapterTitle,
} from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { vietnameseLayoutTranslations } from './translate';
import { useCurrentUrl } from '@/hooks/useCurrentUrl';
import { RouteNameEnum } from '@/constants/route.constant';
import { removeLeadingTrailingSlashes } from '@/libs/utils/common';

const { Content } = Layout;

export type PlayerPageProps = {
    params: {
        m3u8: string;
    };
    searchParams: {
        poster?: string;
        lang?: string;
        name?: string;
        m?: string;
        ep?: string;
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
    const player = useRef<MediaPlayerInstance>(null);
    const { paused } = useMediaStore(player);
    const [initialLoad, setInitialLoad] = useState(true);
    const { host } = useCurrentUrl();

    useEffect(() => {
        if (!paused) {
            setInitialLoad(false);
        }
    }, [paused]);

    return (
        <Layout style={containerStyle}>
            <Content>
                <MediaPlayer
                    ref={player}
                    src={decodeURIComponent(params.m3u8)}
                    playsInline
                    style={{ ...playerStyle }}
                >
                    <MediaProvider>
                        {searchParams?.poster && initialLoad && (
                            <Poster asChild>
                                <Image src={searchParams.poster} alt="Video poster" fill />
                            </Poster>
                        )}
                    </MediaProvider>
                    <DefaultVideoLayout
                        icons={defaultLayoutIcons}
                        translations={
                            searchParams?.lang === 'en' ? undefined : vietnameseLayoutTranslations
                        }
                        slots={{
                            chapterTitle: (
                                <ChapterTitle className="vds-chapter-title">
                                    <Link
                                        href={
                                            searchParams?.m
                                                ? [
                                                      removeLeadingTrailingSlashes(host),
                                                      removeLeadingTrailingSlashes(
                                                          RouteNameEnum.MOVIE_PAGE,
                                                      ),
                                                      encodeURIComponent(searchParams?.m),
                                                      encodeURIComponent(searchParams?.ep),
                                                  ].join('/')
                                                : `${host}/${RouteNameEnum.MOVIE_LIST_PAGE}`
                                        }
                                        target="_blank"
                                    >
                                        <Image
                                            src="/assets/images/logo-mini.png"
                                            alt="vphim Logo"
                                            width={50}
                                            height={15}
                                        />
                                    </Link>
                                </ChapterTitle>
                            ),
                        }}
                    />
                </MediaPlayer>
            </Content>
        </Layout>
    );
}