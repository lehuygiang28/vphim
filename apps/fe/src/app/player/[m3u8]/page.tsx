'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { CSSProperties, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Layout } from 'antd';
import { MediaPlayer, MediaPlayerInstance, MediaProvider, ChapterTitle } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { useUpdate } from '@refinedev/core';
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
        movieSlug: string;
        poster?: string;
        lang?: string;
        name?: string;
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

const MIN_WATCH_TIME = 60; // Minimum watch time in seconds
const MIN_WATCH_PERCENTAGE = 10; // Minimum watch percentage

export default function PlayerPage({ params, searchParams }: PlayerPageProps) {
    const { host } = useCurrentUrl();
    const player = useRef<MediaPlayerInstance>(null);
    const [viewUpdated, setViewUpdated] = useState(false);
    const watchTimeRef = useRef(0);
    const lastTimeRef = useRef(0);

    const { mutate: updateView } = useUpdate({
        errorNotification: false,
        successNotification: false,
    });

    useEffect(() => {
        if (!player.current) return;

        let intervalId: NodeJS.Timeout;

        const handleViewUpdate = () => {
            if (!viewUpdated && player?.current) {
                const { currentTime, duration } = player.current.state;
                if (currentTime > 0 && duration > 0) {
                    const watchedPercentage = (currentTime / duration) * 100;
                    const timeDiff = currentTime - lastTimeRef.current;

                    // Only count time if less than 5 seconds have passed
                    if (timeDiff > 0 && timeDiff < 5) {
                        watchTimeRef.current += timeDiff;
                    }

                    lastTimeRef.current = currentTime;

                    if (
                        watchTimeRef.current >= MIN_WATCH_TIME &&
                        watchedPercentage >= MIN_WATCH_PERCENTAGE
                    ) {
                        updateView({
                            id: searchParams.movieSlug,
                            resource: 'movies/update-view',
                            meta: {
                                method: 'POST',
                            },
                            values: {},
                        });
                        setViewUpdated(true);
                        clearInterval(intervalId);
                    }
                }
            }
        };

        // Subscribe to state updates without triggering renders
        const unsubscribe = player.current.subscribe(({ paused, seeking }) => {
            if (!paused && !viewUpdated && !seeking) {
                intervalId = setInterval(handleViewUpdate, 1000); // Check every second
            } else {
                clearInterval(intervalId);
            }
        });

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [updateView, viewUpdated, searchParams.movieSlug]);

    return (
        <Layout style={containerStyle}>
            <Content>
                <MediaPlayer
                    ref={player}
                    src={decodeURIComponent(params.m3u8)}
                    playsInline
                    style={{ ...playerStyle }}
                    aspectRatio="16/9"
                    storage={'vephim-player-storage'}
                >
                    <MediaProvider></MediaProvider>
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
                                            searchParams?.movieSlug
                                                ? [
                                                      removeLeadingTrailingSlashes(host),
                                                      removeLeadingTrailingSlashes(
                                                          RouteNameEnum.MOVIE_PAGE,
                                                      ),
                                                      encodeURIComponent(searchParams?.movieSlug),
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
                                            priority
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
