'use client';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import React, { CSSProperties, useRef, useEffect, useState, useMemo } from 'react';
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
    useMediaState,
    type MediaViewType,
    type HLSSrc,
} from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { SeekForward10Icon, SeekBackward10Icon } from '@vidstack/react/icons';
import { useUpdate } from '@refinedev/core';

import type { EpisodeServerDataType, MovieType } from 'apps/api/src/app/movies/movie.type';

import { vietnameseLayoutTranslations } from './translate';
import { useM3u8Processor } from '@/hooks/useM3u8Processor';
import { useCurrentUrl } from '@/hooks/useCurrentUrl';
import { RouteNameEnum } from '@/constants/route.constant';
import { removeLeadingTrailingSlashes } from '@/libs/utils/common';
import useWatchHistory from '@/hooks/useWatchHistory';

const { Content } = Layout;

export type PlayerPageProps = {
    params: {
        m3u8: string;
    };
    searchParams: {
        movieSlug: string;
        movieId: string;
        poster?: string;
        lang?: string;
        name?: string;
        ep?: string;
        provider?: string;
        useProcessor?: string;
        proxy?: string;
        removeAds?: string;

        directData?: {
            movie: MovieType;
            selectedServerIndex: number;
            selectedEpisode: EpisodeServerDataType;
            processedUrl: string;
            onError?: () => void;
            onLoad?: () => void;
        };
    };
};

// Improved container style for better iframe integration
const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'black',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
};

// Custom styles to inject for better UI in iframe context
const customPlayerCss = `
.vds-video-layout {
    --video-border-radius: 0;
    --media-border-radius: 0;
}

.vds-video-layout[data-view-type="video"] {
    --video-fit: contain;
}

.media-player {
    --media-background: #000;
    --media-brand: #E50914; /* Netflix red from your theme */
}

/* Improve control visibility */
.vds-controls {
    --control-bg: rgba(0, 0, 0, 0.7);
    --control-bg-hover: rgba(0, 0, 0, 0.8);
}

/* Handle different aspect ratios better */
video {
    object-fit: contain;
    width: 100%;
    height: 100%;
}

.vds-time-slider {
    --slider-track-height: 4px;
    --slider-thumb-size: 16px;
}

/* Make sure UI elements don't overflow */
.vds-time-group, .vds-volume-group {
    font-size: 14px;
}
`;

const MIN_WATCH_TIME = 60; // Minimum watch time in seconds
const MIN_WATCH_PERCENTAGE = 10; // Minimum watch percentage
const SAVE_INTERVAL = 15000; // Save current time every 15 seconds

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

// Player wrapper component to manage player state
function PlayerWrapper({
    src,
    player,
    searchParams,
    translations,
    directData,
}: {
    src: string | HLSSrc;
    player: React.RefObject<MediaPlayerInstance>;
    searchParams: PlayerPageProps['searchParams'];
    translations: Record<string, string>;
    directData?: PlayerPageProps['searchParams']['directData'];
}) {
    const { host } = useCurrentUrl();
    const viewType = useMediaState('viewType', player) as MediaViewType;

    return (
        <MediaPlayer
            ref={player}
            src={src}
            playsInline
            style={{
                width: '100%',
                height: '100%',
                background: 'black',
                border: 'none',
                margin: 0,
                padding: 0,
            }}
            crossOrigin="anonymous"
            storage={'vephim-player-storage'}
            keyTarget="player"
            title={directData?.movie?.name || searchParams?.name || 'Đang phát phim'}
            // Automatically adapt to content instead of fixed aspect ratio
            data-view-type={viewType}
        >
            <style>{customPlayerCss}</style>
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
                translations={translations}
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
                    // Remove unnecessary buttons
                    googleCastButton: <></>,
                    airPlayButton: <></>,
                }}
            />
        </MediaPlayer>
    );
}

export default function PlayerPage({ params, searchParams }: PlayerPageProps) {
    const { directData } = searchParams;
    const { host } = useCurrentUrl();
    const player = useRef<MediaPlayerInstance>(null);
    const [viewUpdated, setViewUpdated] = useState(false);
    const watchTimeRef = useRef(0);
    const lastTimeRef = useRef(0);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [savedTime, setSavedTime] = useState(0);
    const [loadError, setLoadError] = useState(false);

    // Get the source URL from the params
    const sourceUrl = useMemo(() => decodeURIComponent(params.m3u8), [params.m3u8]);

    // Parse provider from searchParams
    const provider = useMemo(() => searchParams.provider as 'o' | 'k', [searchParams.provider]);

    // Check if we should use the client-side processor
    // Keep processing enabled if proxy is needed, even if ad blocking is disabled
    const useClientProcessor = useMemo(
        () => searchParams.useProcessor !== 'false' || searchParams.proxy === 'true',
        [searchParams.useProcessor, searchParams.proxy],
    );

    // Use our M3U8 processor hook if processing is enabled
    const {
        isProcessing,
        processedSrc,
        error: processorError,
    } = useM3u8Processor(useClientProcessor ? sourceUrl : null, {
        provider,
        proxy: searchParams?.proxy === 'true',
        removeAds: searchParams?.removeAds !== 'false',
    });

    // Show error if processor encountered problems
    useEffect(() => {
        if (processorError) {
            console.error('Error processing M3U8:', processorError);
            setLoadError(true);
        }
    }, [processorError]);

    const { mutate: updateView } = useUpdate({
        errorNotification: false,
        successNotification: false,
    });

    const { isAuthenticated, saveHistory } = useWatchHistory();

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
                const { currentTime, duration } = player.current.state;
                if (currentTime > 0) {
                    // Local storage save
                    localStorage.setItem(
                        getStorageKey(host, {
                            movieSlug: searchParams.movieSlug,
                            ep: searchParams.ep,
                        }),
                        currentTime.toString(),
                    );

                    // Save to server if user is authenticated
                    if (isAuthenticated && searchParams.movieSlug && searchParams.ep) {
                        const isCompleted = duration > 0 && (currentTime / duration) * 100 >= 95; // Consider completed if watched 95%

                        // Use directData if available for better data quality
                        const movieData = directData?.movie;
                        const selectedEpisodeData = directData?.selectedEpisode;
                        const serverIndex = directData?.selectedServerIndex || 0;

                        // Get accurate episode name from directData or fallback to params
                        const episodeName =
                            selectedEpisodeData?.name ||
                            movieData?.episode?.[serverIndex]?.serverData.find(
                                (ep) => ep.slug === searchParams.ep,
                            )?.name ||
                            searchParams.name ||
                            `Tập ${searchParams.ep}`;

                        saveHistory({
                            movieId: searchParams.movieId,
                            episodeName: episodeName,
                            episodeSlug: searchParams.ep,
                            serverName:
                                movieData?.episode?.[serverIndex]?.serverName || 'Server Mặc định',
                            serverIndex: serverIndex,
                            progress: {
                                currentTime,
                                duration,
                                completed: isCompleted,
                            },
                        });
                    }
                }
            }
        };

        // Error handling for player
        const onPlayerError = () => {
            setLoadError(true);
            console.error('Media playback error');

            // Call the error callback from directData if available
            if (directData?.onError) {
                directData.onError();
            }
        };

        player.current.addEventListener('error', onPlayerError);

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
            if (player.current) {
                player.current.removeEventListener('error', onPlayerError);
            }
        };
    }, [
        updateView,
        viewUpdated,
        searchParams.movieSlug,
        searchParams.ep,
        host,
        isAuthenticated,
        saveHistory,
    ]);

    useEffect(() => {
        const lastTime = localStorage.getItem(
            getStorageKey(host, { movieSlug: searchParams.movieSlug, ep: searchParams.ep }),
        );
        if (lastTime) {
            const parsedTime = parseFloat(lastTime);
            if (parsedTime > 5) {
                // Only show resume modal if previous position is > 5 seconds
                setSavedTime(parsedTime);
                setShowResumeModal(true);
            }
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
        player.current.play().catch((err) => {
            console.error('Autoplay failed:', err);
        });
    };

    // Update the playerSrc useMemo to prefer directData
    const playerSrc = useMemo(() => {
        // Prefer directData.processedUrl if available
        const sourceUrlToUse = directData?.processedUrl || sourceUrl;

        // If client processing is disabled or there was an error, use direct URL
        if (!useClientProcessor || processorError) {
            return sourceUrlToUse;
        }

        // If we have a processed source and client processing is enabled, use it
        if (processedSrc) {
            return {
                src: processedSrc.src,
                type: 'application/x-mpegurl',
            } satisfies HLSSrc;
        }

        // Fall back to direct URL if processing hasn't completed yet
        return sourceUrlToUse;
    }, [useClientProcessor, processedSrc, processorError, sourceUrl, directData]);

    // Add useEffect to call the onLoad callback from directData when player is ready
    useEffect(() => {
        if (player.current && !isProcessing && directData?.onLoad) {
            const handlePlayerReady = () => {
                directData.onLoad();
            };

            player.current.addEventListener('ready', handlePlayerReady);

            // Call it now if the player is already ready
            if (player.current.state.duration >= 1) {
                directData.onLoad();
            }

            return () => {
                player.current?.removeEventListener('ready', handlePlayerReady);
            };
        }
    }, [player, isProcessing, directData]);

    return (
        <Layout style={containerStyle}>
            <Content style={{ width: '100%', height: '100%', padding: 0 }}>
                {!isProcessing && (
                    <PlayerWrapper
                        src={playerSrc}
                        player={player}
                        searchParams={searchParams}
                        translations={
                            searchParams?.lang === 'en' ? {} : vietnameseLayoutTranslations
                        }
                        directData={directData}
                    />
                )}

                <Modal
                    title="Tiếp tục phát?"
                    open={showResumeModal}
                    onCancel={() => handlePlaybackModal('begin')}
                    footer={null}
                    closable={false}
                    centered
                    styles={{
                        mask: { background: 'rgba(0, 0, 0, 0.8)' },
                        content: { background: '#1A1A1A', borderRadius: '8px' },
                    }}
                >
                    <p>
                        Bạn đã xem tới {formatTime(savedTime)}. Bạn muốn xem tiếp hay quay lại từ
                        đầu?
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
