'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Typography, Grid, Divider, Button, Space, Alert, Row, Col, Tooltip } from 'antd';
import {
    StepForwardOutlined,
    StepBackwardOutlined,
    BulbOutlined,
    BulbFilled,
    BlockOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useDebouncedCallback } from 'use-debounce';

import { useCurrentUrl } from '@/hooks/useCurrentUrl';
import { RouteNameEnum } from '@/constants/route.constant';
import { getEpisodeNameBySlug } from '@/libs/utils/movie.util';
import { useHeaderVisibilityStore } from '@/hooks/useHeaderVisibility';
import useHeaderVisibility from '@/hooks/useHeaderVisibility';

import { MovieEpisode } from '../movie-episode';
import { MovieRelated } from '../movie-related';
import styles from './movie-play.module.css';

const MovieComments = dynamic(() => import('../movie-comment'), { ssr: true });

import type {
    MovieType,
    EpisodeServerDataType,
    EpisodeType,
} from 'apps/api/src/app/movies/movie.type';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

export type MoviePlayProps = {
    movie: MovieType;
    episodeSlug: string;
};

// Helper function for smooth animation easing (defined outside the component to break dependency cycles)
const easeInOutQuad = (t: number) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

// Extract the provider character from originSrc
const getProviderFromOriginSrc = (originSrc?: string): 'o' | 'k' => {
    if (!originSrc || originSrc.length === 0) {
        return null;
    }
    // Get first character and map it to provider format
    const firstChar = originSrc.charAt(0).toLowerCase();
    return firstChar === 'k' ? 'k' : 'o';
};

// Function to construct the player URL based on settings
const constructPlayerUrl = (data: {
    m3u8Url: string;
    currentServer?: EpisodeType;
    enable: boolean;
    removalIndices?: number[];
}): string => {
    if (!data.enable || !data.currentServer?.originSrc) {
        // Use direct M3U8 link without processing
        return data.m3u8Url;
    }

    // With client-side processing, we just pass the URL and parameters
    return data.m3u8Url;
};

export function MoviePlay({ episodeSlug, movie }: MoviePlayProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { md } = useBreakpoint();
    const { host } = useCurrentUrl();
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);

    const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);
    const [hasPrevEpisode, setHasPrevEpisode] = useState<boolean>(false);
    const [hasNextEpisode, setHasNextEpisode] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [useEmbedLink, setUseEmbedLink] = useState<boolean>(false);
    const [isM3u8Available, setIsM3u8Available] = useState<boolean>(true);
    const [isScrolling, setIsScrolling] = useState<boolean>(false);
    const [isLightsOff, setIsLightsOff] = useState<boolean>(false);
    const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);
    const [useProcessedM3u8, setUseProcessedM3u8] = useState<boolean>(true);

    // Access the header visibility controls from the store
    const { hideHeader, enableAutoControl, showHeader } = useHeaderVisibilityStore();

    // Access the hook directly for the methods
    const { setHeaderDuringScroll, setHeaderPositionFixed } = useHeaderVisibility();

    const debouncedSetHeaderDuringScroll = useDebouncedCallback((scrolling: boolean) => {
        setHeaderDuringScroll(scrolling);
    }, 20);

    // Use useDebouncedCallback for smoother performance
    const debouncedSetHeaderPositionFixed = useDebouncedCallback((fixed: boolean) => {
        setHeaderPositionFixed(fixed);
    }, 20);

    const preFetchM3u8 = useCallback(async (url: string) => {
        try {
            const response = await fetch(url, { method: 'GET', next: { revalidate: 3600 } });
            if (!response.ok) {
                throw new Error('M3U8 file not available');
            }
            setIsM3u8Available(true);
        } catch (error) {
            console.error('Error pre-fetching M3U8:', error);
            setIsM3u8Available(false);
        }
    }, []);

    // Ensure auto control is re-enabled when component unmounts
    useEffect(() => {
        // Hide header initially when the video player mounts
        hideHeader();

        // Set header to absolute positioning for better scrolling performance
        debouncedSetHeaderPositionFixed(false);

        return () => {
            // Reset all header states when unmounting
            enableAutoControl();
            setHeaderDuringScroll(false);
            // Set header back to fixed positioning
            debouncedSetHeaderPositionFixed(true);
            // Show header after a slight delay to ensure smooth transition
            setTimeout(() => {
                showHeader();
            }, 100);
        };
    }, [
        hideHeader,
        enableAutoControl,
        setHeaderDuringScroll,
        showHeader,
        debouncedSetHeaderPositionFixed,
    ]);

    const findEpisodeInServer = useCallback(
        (server: EpisodeType, targetSlug: string): EpisodeServerDataType | null => {
            return server.serverData.find((ep) => ep.slug === targetSlug) || null;
        },
        [],
    );

    const findEpisodeAcrossServers = useCallback(
        (
            movie: MovieType,
            targetSlug: string,
        ): { serverIndex: number; episode: EpisodeServerDataType } | null => {
            for (let i = 0; i < movie.episode.length; i++) {
                const foundEpisode = findEpisodeInServer(movie.episode[i], targetSlug);
                if (foundEpisode) {
                    return { serverIndex: i, episode: foundEpisode };
                }
            }
            return null;
        },
        [findEpisodeInServer],
    );

    useEffect(() => {
        const serverIndex = parseInt(searchParams.get('server') || '0', 10);
        setSelectedServerIndex(serverIndex);

        // Reset loading state when episode changes
        setIsVideoLoading(true);

        if (
            movie?.trailerUrl &&
            (episodeSlug === 'trailer' ||
                !movie.episode ||
                movie.episode.length === 0 ||
                (!movie.episode[0].serverData[0].linkM3u8 &&
                    !movie.episode[0].serverData[0].linkEmbed))
        ) {
            setSelectedEpisode({
                slug: 'trailer',
                name: 'Trailer',
                filename: 'trailer',
                linkM3u8: movie.trailerUrl,
                linkEmbed: movie.trailerUrl,
            });
            setHasPrevEpisode(false);
            setHasNextEpisode(false);
        } else if (movie?.episode && movie.episode.length > 0) {
            let foundEpisode: EpisodeServerDataType | null = null;
            let actualServerIndex = serverIndex;

            // Try to find the episode in the specified server
            if (movie.episode[serverIndex]) {
                foundEpisode = findEpisodeInServer(movie.episode[serverIndex], episodeSlug);
            }

            // If not found, fallback to server 0 or search all servers
            if (!foundEpisode) {
                const result = findEpisodeAcrossServers(movie, episodeSlug);
                if (result) {
                    foundEpisode = result.episode;
                    actualServerIndex = result.serverIndex;
                    setSelectedServerIndex(actualServerIndex);
                }
            }

            if (foundEpisode) {
                setSelectedEpisode(foundEpisode);
                if (foundEpisode.linkM3u8) {
                    preFetchM3u8(foundEpisode.linkM3u8);
                } else if (foundEpisode.linkEmbed) {
                    setUseEmbedLink(true);
                    setIsM3u8Available(false);
                } else {
                    setError('Phim đang được cập nhật, vui lòng quay lại sau.');
                }

                const currentEpisodeIndex = movie.episode[actualServerIndex].serverData.findIndex(
                    (ep) => ep.slug === episodeSlug,
                );
                setHasPrevEpisode(currentEpisodeIndex > 0);
                setHasNextEpisode(
                    currentEpisodeIndex < movie.episode[actualServerIndex].serverData.length - 1,
                );
            } else {
                setError('Không tìm thấy tập phim. Vui lòng thử lại sau.');
            }
        } else {
            setError('Phim đang được cập nhật, vui lòng quay lại sau.');
        }
    }, [
        movie,
        episodeSlug,
        preFetchM3u8,
        searchParams,
        findEpisodeInServer,
        findEpisodeAcrossServers,
    ]);

    const handleServerChange = (serverIndex: number) => {
        setSelectedServerIndex(serverIndex);
        // Reset video loading state when changing server
        setIsVideoLoading(true);

        const newEpisode = movie?.episode?.[serverIndex]?.serverData[0];
        if (newEpisode) {
            setSelectedEpisode(newEpisode);
            setUseEmbedLink(false);
            setIsM3u8Available(true);
            if (newEpisode.linkM3u8) {
                preFetchM3u8(newEpisode.linkM3u8);
            } else if (newEpisode.linkEmbed) {
                setUseEmbedLink(true);
                setIsM3u8Available(false);
            }
            navigateToEpisode(newEpisode.slug, serverIndex);
        }
    };

    const handleVideoError = () => {
        setIsVideoLoading(false);
        if (isM3u8Available && !useEmbedLink && selectedEpisode?.linkEmbed) {
            setUseEmbedLink(true);
        } else {
            setError('Không thể phát video. Vui lòng thử lại sau.');
        }
    };

    const handleVideoLoad = () => {
        setIsVideoLoading(false);
    };

    const navigateToEpisode = (episodeSlug: string, serverIndex: number) => {
        router.push(
            `${RouteNameEnum.MOVIE_PAGE}/${encodeURIComponent(movie?.slug)}/${encodeURIComponent(
                episodeSlug,
            )}?server=${serverIndex}`,
        );
    };

    // Create a ref to hold the current cancel function for scrolling
    const currentCancelScrollRef = useRef<(() => void) | undefined>();

    // Define smoothScroll with useCallback to maintain reference stability
    const smoothScroll = useCallback(
        (element: HTMLElement, to: number, duration = 300) => {
            // Prevent multiple scrolling operations at once
            if (isScrolling) return;

            // Cancel any previous scroll
            if (currentCancelScrollRef.current) {
                currentCancelScrollRef.current();
                currentCancelScrollRef.current = undefined;
            }

            setIsScrolling(true);

            // Mark that we're in a scrolling state and use absolute positioning
            debouncedSetHeaderDuringScroll(true);
            debouncedSetHeaderPositionFixed(false);

            // Track animation frame ID for cleanup
            let animationFrameId: number | null = null;
            let timeoutId: number | null = null;
            // Track if scrolling is cancelled
            let isCancelled = false;

            // Clean up function to cancel scrolling
            const cancelScroll = () => {
                if (animationFrameId !== null) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                isCancelled = true;
                setIsScrolling(false);
                debouncedSetHeaderDuringScroll(false);
            };

            // Try to detect if this is a high-performance device
            const isHighPerformanceDevice =
                !navigator.userAgent.includes('Mobile') && !navigator.userAgent.includes('Android');

            // Use native smooth scrolling on high-performance devices that support it
            if (isHighPerformanceDevice && 'scrollBehavior' in document.documentElement.style) {
                try {
                    window.scrollTo({
                        top: to,
                        behavior: 'smooth',
                    });

                    // Set scrolling complete after duration
                    timeoutId = window.setTimeout(() => {
                        if (!isCancelled) {
                            setIsScrolling(false);

                            // Add a delay before showing header again for better viewing
                            window.setTimeout(() => {
                                debouncedSetHeaderDuringScroll(false);
                                // Set header back to fixed positioning after a delay
                                setTimeout(() => {
                                    debouncedSetHeaderPositionFixed(true);
                                }, 500);
                            }, 1000); // Keep header hidden for 1 second after scroll completes
                        }
                    }, duration);

                    // Return cancel function for cleanup
                    return cancelScroll;
                } catch (error) {
                    console.warn('Native smooth scroll failed, using fallback');
                }
            }

            // Manual implementation with requestAnimationFrame for better performance
            const startTime = performance.now();
            const startPosition = window.pageYOffset || document.documentElement.scrollTop;
            const distance = to - startPosition;

            // If the distance is too small, just jump to position
            if (Math.abs(distance) < 10) {
                window.scrollTo(0, to);
                setIsScrolling(false);

                // Keep header hidden a bit longer for better viewing experience
                timeoutId = window.setTimeout(() => {
                    debouncedSetHeaderDuringScroll(false);
                    // Set header back to fixed positioning after a delay
                    setTimeout(() => {
                        debouncedSetHeaderPositionFixed(true);
                    }, 500);
                }, 1000);

                return cancelScroll;
            }

            const animateScroll = (currentTime: number) => {
                if (isCancelled) return;

                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const easeProgress = easeInOutQuad(progress);

                window.scrollTo(0, startPosition + distance * easeProgress);

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animateScroll);
                } else {
                    // Scrolling completed - add a small delay before showing header again
                    setIsScrolling(false);
                    // Keep header hidden a bit longer for better viewing experience
                    timeoutId = window.setTimeout(() => {
                        debouncedSetHeaderDuringScroll(false);
                        // Set header back to fixed positioning after a delay
                        setTimeout(() => {
                            debouncedSetHeaderPositionFixed(true);
                        }, 500);
                    }, 1000); // Wait 1 second before allowing header to reappear
                    animationFrameId = null;
                }
            };

            animationFrameId = requestAnimationFrame(animateScroll);

            // Store cancel function in ref for future cleanup
            currentCancelScrollRef.current = cancelScroll;

            // Return cancel function
            return cancelScroll;
        },
        [
            isScrolling,
            setIsScrolling,
            debouncedSetHeaderDuringScroll,
            debouncedSetHeaderPositionFixed,
            // easeInOutQuad is no longer a dependency because it's defined outside the component
        ],
    );

    // Effect to clean up any ongoing scroll when unmounting
    useEffect(() => {
        return () => {
            // Clean up any ongoing scroll when component unmounts
            if (currentCancelScrollRef.current) {
                currentCancelScrollRef.current();
                currentCancelScrollRef.current = undefined;
            }
        };
    }, []);

    // Handler for clicks on the overlay to turn lights back on
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Use a wrapper ref to include all player elements
        const playerWrapperEl = document.querySelector(`.${styles.playerWrapper}`);

        // Check if click is outside player wrapper which contains both player and controls
        if (playerWrapperEl && !playerWrapperEl.contains(e.target as Node)) {
            setIsLightsOff(false);
        }
    };

    // Toggle lights on/off
    const toggleLights = useCallback(() => {
        setIsLightsOff((prev) => !prev);

        // When turning lights off, also position the video optimally
        if (!isLightsOff) {
            const videoPlayer = document.getElementById('video-player');
            if (videoPlayer) {
                const rect = videoPlayer.getBoundingClientRect();
                const scrollTop = window.scrollY || document.documentElement.scrollTop;

                // Position the video at the top of the viewport with a small gap
                const targetPosition = rect.top + scrollTop - 15;

                // Set header to scroll mode with absolute positioning for better performance
                debouncedSetHeaderDuringScroll(true);
                debouncedSetHeaderPositionFixed(false);

                // Hide header immediately when turning lights off
                hideHeader();

                // Use smooth scrolling with a faster duration for a better experience
                smoothScroll(document.documentElement, targetPosition, 250);
            }
        } else {
            // When turning lights back on, delay showing the header to avoid visual glitches
            setTimeout(() => {
                debouncedSetHeaderPositionFixed(true);
                // Allow header to show depending on scroll position
                debouncedSetHeaderDuringScroll(false);
            }, 300);
        }
    }, [
        isLightsOff,
        debouncedSetHeaderDuringScroll,
        debouncedSetHeaderPositionFixed,
        hideHeader,
        smoothScroll,
    ]);

    // Keyboard shortcut for toggling lights (L key)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Use 'L' key as a shortcut to toggle lights
            if (e.key === 'l' || e.key === 'L') {
                toggleLights();
            }
        };

        // Double-tap handler for touch devices
        let lastTap = 0;
        const handleDoubleTap = (e: TouchEvent) => {
            // Only respond to taps on the video player
            if (e.target && (e.target as HTMLElement).id === 'video-player') {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;

                // Check if double tap (tap within 500ms of last tap)
                if (tapLength < 500 && tapLength > 0) {
                    e.preventDefault(); // Prevent zooming
                    toggleLights();
                }
                lastTap = currentTime;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('touchend', handleDoubleTap);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('touchend', handleDoubleTap);
        };
    }, [toggleLights]); // Update dependency to the memoized function

    // Modify goToAdjacentEpisode
    const goToAdjacentEpisode = (direction: 'prev' | 'next') => {
        const currentServer = movie?.episode?.[selectedServerIndex];

        if (currentServer) {
            const currentEpisodeIndex = currentServer.serverData.findIndex(
                (ep) => ep.slug === selectedEpisode?.slug,
            );
            if (currentEpisodeIndex !== -1) {
                const adjacentIndex =
                    direction === 'prev' ? currentEpisodeIndex - 1 : currentEpisodeIndex + 1;
                const adjacentEpisode = currentServer.serverData[adjacentIndex];
                if (adjacentEpisode) {
                    // Reset video loading state
                    setIsVideoLoading(true);
                    setSelectedEpisode(adjacentEpisode);
                    setUseEmbedLink(false);
                    setIsM3u8Available(true);
                    if (adjacentEpisode.linkM3u8) {
                        preFetchM3u8(adjacentEpisode.linkM3u8);
                    }
                    navigateToEpisode(adjacentEpisode.slug, selectedServerIndex);
                }
            }
        }
    };

    // Load user preference for ad blocking from localStorage
    useEffect(() => {
        try {
            const savedPreference = localStorage.getItem('vphim_adblock_preference');
            if (savedPreference !== null) {
                setUseProcessedM3u8(savedPreference === 'true');
            }
        } catch (e) {
            // Silent fail if localStorage is not available
            console.warn('Failed to load ad blocking preference from localStorage');
        }
    }, []);

    // Save user preference for ad blocking to localStorage
    const toggleAdBlocking = useCallback((newValue: boolean) => {
        setUseProcessedM3u8(newValue);
        try {
            localStorage.setItem('vphim_adblock_preference', String(newValue));
        } catch (e) {
            // Silent fail if localStorage is not available
            console.warn('Failed to save ad blocking preference to localStorage:', e);
        }
    }, []);

    // Add useMemo for computed values that don't need to be recalculated on every render
    const currentServer = useMemo(
        () => movie?.episode?.[selectedServerIndex],
        [movie, selectedServerIndex],
    );

    // Use useMemo for the processed URL to avoid recalculating it on every render
    const processedUrl = useMemo(() => {
        if (!selectedEpisode?.linkM3u8 || !currentServer) return '';

        return constructPlayerUrl({
            m3u8Url: selectedEpisode.linkM3u8,
            currentServer,
            enable: useProcessedM3u8,
        });
    }, [selectedEpisode, currentServer, useProcessedM3u8]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
            }}
            className={`${isScrolling ? styles.containerWithHeaderSpace : ''} ${
                isLightsOff ? styles.lightsOff : ''
            }`}
        >
            {/* Overlay for lights off mode */}
            {isLightsOff && (
                <div className={styles.lightsOffOverlay} onClick={handleOverlayClick} />
            )}

            {error ? (
                <Alert
                    message="Đang cập nhật..."
                    description={error}
                    type="info"
                    showIcon
                    style={{ marginBottom: '1rem', width: '100%' }}
                />
            ) : (
                <>
                    <div className={styles.playerWrapper}>
                        <div
                            ref={videoContainerRef}
                            className={`${styles.videoContainer} ${
                                isScrolling ? styles.videoContainerPadding : ''
                            }`}
                        >
                            {isVideoLoading && <div className={styles.loadingIndicator} />}
                            {selectedEpisode && (
                                <iframe
                                    id="video-player"
                                    width="100%"
                                    height="100%"
                                    src={
                                        !isM3u8Available || useEmbedLink
                                            ? selectedEpisode.linkEmbed
                                            : `${host}/player/${encodeURIComponent(
                                                  processedUrl,
                                              )}?movieSlug=${encodeURIComponent(
                                                  movie?.slug,
                                              )}&ep=${encodeURIComponent(
                                                  selectedEpisode.slug,
                                              )}&useProcessor=${
                                                  useProcessedM3u8 ? 'true' : 'false'
                                              }&provider=${getProviderFromOriginSrc(
                                                  movie?.episode?.[selectedServerIndex]?.originSrc,
                                              )}`
                                    }
                                    title={movie?.name || 'Movie Player'}
                                    allowFullScreen
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    onError={handleVideoError}
                                    onLoad={handleVideoLoad}
                                />
                            )}
                        </div>
                        <Space ref={controlsRef} className={styles.controls}>
                            <Button
                                icon={isLightsOff ? <BulbFilled /> : <BulbOutlined />}
                                onClick={toggleLights}
                                size={md ? 'middle' : 'small'}
                                className={styles.lightsToggleButton}
                                title={`${isLightsOff ? 'Bật đèn' : 'Tắt đèn'} (phím L)`}
                            >
                                {md ? (isLightsOff ? 'Bật đèn' : 'Tắt đèn') : ''}
                            </Button>
                            <Button
                                icon={<StepBackwardOutlined />}
                                onClick={() => goToAdjacentEpisode('prev')}
                                disabled={!hasPrevEpisode}
                                size={md ? 'middle' : 'small'}
                            >
                                {md && 'Tập trước'}
                            </Button>
                            <Button
                                icon={<StepForwardOutlined />}
                                onClick={() => goToAdjacentEpisode('next')}
                                disabled={!hasNextEpisode}
                                size={md ? 'middle' : 'small'}
                            >
                                {md && 'Tập tiếp theo'}
                            </Button>
                            <Tooltip
                                title={
                                    useProcessedM3u8
                                        ? 'Đang chặn quảng cáo - Nhấn để tắt'
                                        : 'Bật chặn quảng cáo (có thể ảnh hưởng đến phát video)'
                                }
                            >
                                <Button
                                    icon={
                                        useProcessedM3u8 ? (
                                            <CheckCircleOutlined />
                                        ) : (
                                            <BlockOutlined />
                                        )
                                    }
                                    onClick={() => toggleAdBlocking(!useProcessedM3u8)}
                                    size={md ? 'middle' : 'small'}
                                    type={useProcessedM3u8 ? 'primary' : 'default'}
                                    className={useProcessedM3u8 ? styles.adBlockActiveButton : ''}
                                    style={
                                        useProcessedM3u8
                                            ? {
                                                  backgroundColor:
                                                      'var(--vphim-color-success, #52c41a)',
                                                  borderColor:
                                                      'var(--vphim-color-success, #52c41a)',
                                              }
                                            : undefined
                                    }
                                >
                                    {md
                                        ? useProcessedM3u8
                                            ? 'Tắt chặn quảng cáo'
                                            : 'Bật chặn quảng cáo'
                                        : ''}
                                </Button>
                            </Tooltip>
                        </Space>
                        <div className={styles.playerTip}>
                            <Alert
                                message="Nếu video không phát được, hãy thử tắt chức năng chặn quảng cáo hoặc đổi máy chủ"
                                type="info"
                                showIcon
                                className={styles.adBlockTip}
                                style={{
                                    backgroundColor:
                                        'var(--vphim-color-info-bg, rgba(24, 144, 255, 0.1))',
                                    borderColor:
                                        'var(--vphim-color-info-border, rgba(24, 144, 255, 0.2))',
                                }}
                            />
                        </div>
                    </div>
                </>
            )}
            <div className={styles.movieContent}>
                {movie && (
                    <>
                        <Divider />
                        <MovieEpisode
                            movie={movie}
                            activeEpisodeSlug={episodeSlug}
                            activeServerIndex={selectedServerIndex}
                            showServers={true}
                            onServerChange={handleServerChange}
                        />
                    </>
                )}
                <Divider />
                <div style={{ marginTop: '2rem' }}>
                    <Title level={2}>
                        {movie?.name} - {getEpisodeNameBySlug(movie, selectedEpisode?.slug)}
                    </Title>
                    <Title level={3}>
                        {movie?.name} - {movie?.originName} ({movie?.quality?.toUpperCase()} -{' '}
                        {movie?.lang})
                    </Title>
                    <Title level={4} type="secondary">
                        {getEpisodeNameBySlug(movie, selectedEpisode?.slug)}
                    </Title>
                    <Paragraph
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        onClick={() => {}}
                        ellipsis={{
                            rows: 5,
                            expandable: true,
                            symbol: (
                                <Link
                                    href={`${RouteNameEnum.MOVIE_PAGE}/${encodeURIComponent(
                                        movie?.slug,
                                    )}`}
                                >
                                    <Text type="warning">Xem Thêm</Text>
                                </Link>
                            ),
                        }}
                    >
                        {movie?.content}
                    </Paragraph>
                </div>
                <Divider />
                {movie && (
                    <>
                        <Row style={{ marginTop: '2rem', marginBottom: '4rem' }}>
                            <Col span={24}>
                                <MovieRelated movie={movie} />
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24}>
                                <MovieComments movieId={movie?._id?.toString()} />
                            </Col>
                        </Row>
                    </>
                )}
            </div>
        </div>
    );
}
