'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Typography, Grid, Divider, Button, Space, Alert, Row, Col } from 'antd';
import { ExpandAltOutlined, StepForwardOutlined, StepBackwardOutlined } from '@ant-design/icons';

import { useCurrentUrl } from '@/hooks/useCurrentUrl';
import { RouteNameEnum } from '@/constants/route.constant';
import { getEpisodeNameBySlug } from '@/libs/utils/movie.util';

import { MovieEpisode } from '../movie-episode';
import { MovieRelated } from '../movie-related';
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

    const preFetchM3u8 = useCallback(async (url: string) => {
        try {
            const response = await fetch(url, { method: 'GET', next: { revalidate: 360000 } });
            if (!response.ok) {
                throw new Error('M3U8 file not available');
            }
            setIsM3u8Available(true);
        } catch (error) {
            console.error('Error pre-fetching M3U8:', error);
            setIsM3u8Available(false);
        }
    }, []);

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
        if (isM3u8Available && !useEmbedLink && selectedEpisode?.linkEmbed) {
            setUseEmbedLink(true);
        } else {
            setError('Không thể phát video. Vui lòng thử lại sau.');
        }
    };

    const navigateToEpisode = (episodeSlug: string, serverIndex: number) => {
        router.push(
            `${RouteNameEnum.MOVIE_PAGE}/${encodeURIComponent(movie?.slug)}/${encodeURIComponent(
                episodeSlug,
            )}?server=${serverIndex}`,
        );
    };

    const smoothScroll = (element: HTMLElement, to: number, duration: number) => {
        const start = element.scrollTop;
        const change = to - start;
        const increment = 20;
        let currentTime = 0;

        const animateScroll = () => {
            currentTime += increment;
            const val = easeInOutQuad(currentTime, start, change, duration);
            element.scrollTop = val;
            if (currentTime < duration) {
                setTimeout(animateScroll, increment);
            }
        };

        animateScroll();
    };

    const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
        t /= d / 2;
        if (t < 1) return (c / 2) * t * t + b;
        t--;
        return (-c / 2) * (t * (t - 2) - 1) + b;
    };

    const fitToScreen = () => {
        const videoPlayer = document.getElementById('video-player');
        if (videoPlayer) {
            const rect = videoPlayer.getBoundingClientRect();
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const targetPosition = rect.top + scrollTop - 20; // 20px offset from the top

            smoothScroll(document.documentElement, targetPosition, 300); // 300ms duration
        }
    };

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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                    <div
                        ref={videoContainerRef}
                        style={{
                            position: 'relative',
                            width: '90vw',
                            maxWidth: '1600px',
                            margin: '0 auto',
                            paddingTop: 'calc(85vw * 9 / 16)', // This creates the 16:9 aspect ratio
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                maxHeight: md ? '90vh' : '25vh',
                                overflow: 'hidden',
                            }}
                        >
                            {selectedEpisode && (
                                <iframe
                                    id="video-player"
                                    width="100%"
                                    height="100%"
                                    src={
                                        !isM3u8Available || useEmbedLink
                                            ? selectedEpisode.linkEmbed
                                            : `${host}/player/${encodeURIComponent(
                                                  selectedEpisode.linkM3u8,
                                              )}?movieSlug=${encodeURIComponent(
                                                  movie?.slug,
                                              )}&poster=${encodeURIComponent(
                                                  movie?.thumbUrl?.includes('/phimimg.com/upload')
                                                      ? movie?.thumbUrl
                                                      : movie?.posterUrl,
                                              )}&ep=${encodeURIComponent(selectedEpisode.slug)}`
                                    }
                                    title={movie?.name}
                                    allowFullScreen
                                    style={{
                                        border: 'none',
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                    onError={handleVideoError}
                                />
                            )}
                        </div>
                    </div>
                    <Space
                        ref={controlsRef}
                        style={{
                            backgroundColor: 'transparent',
                            borderRadius: 8,
                            marginTop: md ? '0.5rem' : '1rem',
                        }}
                    >
                        <Button
                            icon={<StepBackwardOutlined />}
                            onClick={() => goToAdjacentEpisode('prev')}
                            disabled={!hasPrevEpisode}
                        >
                            {md && 'Tập trước đó'}
                        </Button>
                        {md && (
                            <Button icon={<ExpandAltOutlined />} onClick={fitToScreen}>
                                Đang phát
                            </Button>
                        )}
                        <Button
                            icon={<StepForwardOutlined />}
                            onClick={() => goToAdjacentEpisode('next')}
                            disabled={!hasNextEpisode}
                        >
                            {md && 'Tập tiếp theo'}
                        </Button>
                    </Space>
                </>
            )}
            <div style={{ width: '100%', marginTop: 16 }}>
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
