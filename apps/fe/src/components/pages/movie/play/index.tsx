'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Typography, Grid, Divider, Button, Space, Alert } from 'antd';
import { ExpandAltOutlined, StepForwardOutlined, StepBackwardOutlined } from '@ant-design/icons';

import { useCurrentUrl } from '@/hooks/useCurrentUrl';
import { RouteNameEnum } from '@/constants/route.constant';
import { getEpisodeNameBySlug } from '@/libs/utils/movie.util';
import { MovieEpisode } from '../movie-episode';
import { MovieRelated } from '../movie-related';

import type { MovieType, EpisodeServerDataType } from 'apps/api/src/app/movies/movie.type';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

export type MoviePlayProps = {
    movie: MovieType;
    episodeSlug: string;
};

export function MoviePlay({ episodeSlug, movie }: MoviePlayProps) {
    const router = useRouter();
    const { md } = useBreakpoint();
    const { host } = useCurrentUrl();
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);

    const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);
    const [hasPrevEpisode, setHasPrevEpisode] = useState<boolean>(false);
    const [hasNextEpisode, setHasNextEpisode] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (
            movie?.trailerUrl &&
            (episodeSlug === 'trailer' ||
                !movie.episode ||
                movie.episode.length === 0 ||
                !movie.episode[0].serverData[0].linkM3u8)
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
        } else if (
            movie?.episode &&
            movie.episode.length > 0 &&
            movie.episode[0].serverData[0].linkM3u8
        ) {
            const episode = movie.episode.find((ep) =>
                ep.serverData.some((server) => server.slug === episodeSlug),
            );
            if (episode) {
                const serverIndex = movie.episode.findIndex(
                    (ep) => ep.serverName === episode.serverName,
                );
                setSelectedServerIndex(serverIndex);
                const currentEpisode =
                    episode.serverData.find((server) => server.slug === episodeSlug) || null;
                setSelectedEpisode(currentEpisode);

                const currentEpisodeIndex = episode.serverData.findIndex(
                    (ep) => ep.slug === episodeSlug,
                );
                setHasPrevEpisode(currentEpisodeIndex > 0);
                setHasNextEpisode(currentEpisodeIndex < episode.serverData.length - 1);
            }
        } else {
            setError('Phim đang được cập nhật, vui lòng quay lại sau.');
        }
    }, [movie, episodeSlug]);

    const handleServerChange = (serverIndex: number) => {
        setSelectedServerIndex(serverIndex);
        const newEpisode = movie?.episode?.[serverIndex]?.serverData[0];
        if (newEpisode) {
            setSelectedEpisode(newEpisode);
            router.push(
                `${RouteNameEnum.MOVIE_PAGE}/${encodeURIComponent(
                    movie?.slug,
                )}/${encodeURIComponent(newEpisode.slug)}`,
            );
        }
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

            smoothScroll(document.documentElement, targetPosition, 300); // 500ms duration
        }
    };

    const goToAdjacentEpisode = (direction: 'prev' | 'next') => {
        const currentEpisodeIndex = movie?.episode?.[selectedServerIndex]?.serverData.findIndex(
            (ep) => ep.slug === selectedEpisode?.slug,
        );
        if (currentEpisodeIndex !== undefined && currentEpisodeIndex !== -1) {
            const adjacentIndex =
                direction === 'prev' ? currentEpisodeIndex - 1 : currentEpisodeIndex + 1;
            const adjacentEpisode =
                movie?.episode?.[selectedServerIndex]?.serverData[adjacentIndex];
            if (adjacentEpisode) {
                setSelectedEpisode(adjacentEpisode);
                router.push(
                    `${RouteNameEnum.MOVIE_PAGE}/${encodeURIComponent(
                        movie?.slug,
                    )}/${encodeURIComponent(adjacentEpisode.slug)}`,
                );
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {error ? (
                <Alert
                    message="Đang cập nhật..."
                    description={error}
                    type="warning"
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
                            {selectedEpisode?.linkM3u8 && (
                                <iframe
                                    id="video-player"
                                    width="100%"
                                    height="100%"
                                    src={
                                        selectedEpisode?.linkM3u8
                                            ? `${host}/player/${encodeURIComponent(
                                                  selectedEpisode.linkM3u8,
                                              )}?movieSlug=${encodeURIComponent(
                                                  movie?.slug,
                                              )}&poster=${encodeURIComponent(
                                                  movie?.thumbUrl?.includes('/phimimg.com/upload')
                                                      ? movie?.thumbUrl
                                                      : movie?.posterUrl,
                                              )}&ep=${encodeURIComponent(selectedEpisode.slug)}`
                                            : selectedEpisode?.linkEmbed
                                    }
                                    title={movie?.name}
                                    allowFullScreen
                                    style={{
                                        border: 'none',
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    <Space
                        ref={controlsRef}
                        style={{
                            backgroundColor: 'transparent',
                            borderRadius: 8,
                            marginTop: md ? undefined : '1rem',
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
                    <MovieEpisode
                        movie={movie}
                        activeEpisodeSlug={episodeSlug}
                        activeServerIndex={selectedServerIndex}
                        showServers={true}
                        onServerChange={handleServerChange}
                        useServersDivider={true}
                        useEpisodesDivider={false}
                    />
                )}
                <Divider />
                <div style={{ marginTop: '2rem' }}>
                    <Title level={2}>
                        {movie?.name} - {getEpisodeNameBySlug(movie, selectedEpisode?.slug)}
                    </Title>
                    <Title level={3}>
                        {movie?.name} - {movie?.originName} ({movie?.quality})
                    </Title>
                    <Title level={4} type="secondary">
                        {getEpisodeNameBySlug(movie, selectedEpisode?.slug)}
                    </Title>
                    <Paragraph
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
                    <div style={{ marginTop: '2rem', marginBottom: md ? '4rem' : '2rem' }}>
                        <MovieRelated movie={movie} />
                    </div>
                )}
            </div>
        </div>
    );
}
