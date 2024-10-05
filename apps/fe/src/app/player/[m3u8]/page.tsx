'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import React, { CSSProperties, useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Layout, Modal, Button } from 'antd';
import {
    MediaPlayer,
    MediaPlayerInstance,
    MediaProvider,
    ChapterTitle,
    Track,
    SeekButton,
} from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { SeekForward10Icon, SeekBackward10Icon } from '@vidstack/react/icons';
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
const SAVE_INTERVAL = 5000; // Save current time every 5 seconds

function formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const getStorageKey = (host: string, searchParams: { movieSlug: string; ep?: string }) => {
    const episodeUrl = [
        removeLeadingTrailingSlashes(host),
        removeLeadingTrailingSlashes(RouteNameEnum.MOVIE_PAGE),
        encodeURIComponent(searchParams?.movieSlug),
        encodeURIComponent(searchParams?.ep),
    ].join('/');
    return `vephim-lastTime-${episodeUrl}`;
};

export default function PlayerPage({ params, searchParams }: PlayerPageProps) {
    const { host } = useCurrentUrl();
    const player = useRef<MediaPlayerInstance>(null);
    const [viewUpdated, setViewUpdated] = useState(false);
    const watchTimeRef = useRef(0);
    const lastTimeRef = useRef(0);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [savedTime, setSavedTime] = useState(0);

    const { mutate: updateView } = useUpdate({
        errorNotification: false,
        successNotification: false,
    });

    useEffect(() => {
        if (!player.current) return;

        let intervalId: NodeJS.Timeout;
        let saveIntervalId: NodeJS.Timeout;

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

        const saveCurrentTime = () => {
            if (player.current) {
                const { currentTime } = player.current.state;
                localStorage.setItem(
                    getStorageKey(host, { movieSlug: searchParams.movieSlug, ep: searchParams.ep }),
                    currentTime.toString(),
                );
            }
        };

        // Subscribe to state updates without triggering renders
        const unsubscribe = player.current.subscribe(({ paused, seeking }) => {
            if (!paused && !viewUpdated && !seeking) {
                intervalId = setInterval(handleViewUpdate, 1000); // Check every second
                saveIntervalId = setInterval(saveCurrentTime, SAVE_INTERVAL); // Save current time every 5 seconds
            } else {
                clearInterval(intervalId);
                clearInterval(saveIntervalId);
            }
        });

        return () => {
            unsubscribe();
            clearInterval(intervalId);
            clearInterval(saveIntervalId);
        };
    }, [updateView, viewUpdated, searchParams.movieSlug, searchParams.ep, host]);

    useEffect(() => {
        const lastTime = localStorage.getItem(
            getStorageKey(host, { movieSlug: searchParams.movieSlug, ep: searchParams.ep }),
        );
        if (lastTime) {
            const parsedTime = parseFloat(lastTime);
            setSavedTime(parsedTime);
            setShowResumeModal(true);
        }
    }, [searchParams.movieSlug, searchParams.ep, host]);

    const handlePlaybackModal = (event: 'begin' | 'resume') => {
        if (!player.current) return;
        if (event === 'begin') {
            player.current.currentTime = 0;
        } else {
            player.current.currentTime = savedTime;
        }
        setShowResumeModal(false);
        player.current.play();
    };

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
                    <MediaProvider>
                        <Track
                            kind="subtitles"
                            src="/data/mttq.json"
                            type={'json'}
                            default={true}
                            label="MTTQ"
                        />
                    </MediaProvider>
                    <DefaultVideoLayout
                        icons={defaultLayoutIcons}
                        translations={
                            searchParams?.lang === 'en' ? undefined : vietnameseLayoutTranslations
                        }
                        slots={{
                            largeLayout: {
                                afterPlayButton: (
                                    <>
                                        <SeekButton className="vds-button" seconds={-10}>
                                            <SeekBackward10Icon className="vds-icon" />
                                        </SeekButton>
                                        <SeekButton className="vds-button" seconds={10}>
                                            <SeekForward10Icon className="vds-icon" />
                                        </SeekButton>
                                    </>
                                ),
                            },
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
                            googleCastButton: <></>,
                            airPlayButton: <></>,
                        }}
                    />
                </MediaPlayer>
                <Modal
                    title="Tiếp tục phát?"
                    open={showResumeModal}
                    onCancel={() => handlePlaybackModal('begin')}
                    footer={null}
                    closable={false}
                    centered
                >
                    <p>
                        Bạn đã xem tới {formatTime(savedTime)}. Bạn muốn xem tiếp hay quay lại từ
                        đầu ?
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button
                            onClick={() => handlePlaybackModal('begin')}
                            style={{ marginRight: '10px' }}
                        >
                            Xem lại từ đầu
                        </Button>
                        <Button type="primary" onClick={() => handlePlaybackModal('resume')}>
                            Xem tiếp
                        </Button>
                    </div>
                </Modal>
            </Content>
        </Layout>
    );
}
