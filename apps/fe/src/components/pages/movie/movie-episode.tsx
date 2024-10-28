'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, Button, Typography, Alert, ConfigProvider, theme } from 'antd';

import type {
    MovieType,
    EpisodeType,
    EpisodeServerDataType,
} from 'apps/api/src/app/movies/movie.type';

const { Title } = Typography;

export type MovieEpisodeProps = {
    movie: MovieType;
    activeEpisodeSlug?: string;
    activeServerIndex?: number;
    showServers?: boolean;
    onServerChange?: (index: number) => void;
    showTrailerAsFirstEpisode?: boolean;
};

export function MovieEpisode({
    movie,
    activeEpisodeSlug,
    activeServerIndex = 0,
    showServers = true,
    onServerChange,
    showTrailerAsFirstEpisode = true,
}: MovieEpisodeProps) {
    const router = useRouter();
    const [activeKey, setActiveKey] = useState(activeServerIndex.toString());
    const episodeListRef = useRef<HTMLDivElement>(null);
    const activeEpisodeRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        setActiveKey(activeServerIndex.toString());
    }, [activeServerIndex]);

    useEffect(() => {
        if (episodeListRef.current && activeEpisodeRef.current) {
            const container = episodeListRef.current;
            const activeEpisode = activeEpisodeRef.current;

            const scrollToActiveEpisode = () => {
                const containerRect = container.getBoundingClientRect();
                const activeEpisodeRect = activeEpisode.getBoundingClientRect();

                if (
                    activeEpisodeRect.top < containerRect.top ||
                    activeEpisodeRect.bottom > containerRect.bottom
                ) {
                    activeEpisode.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            };

            // Delay the scroll to ensure the DOM has updated
            setTimeout(scrollToActiveEpisode, 100);
        }
    }, [activeEpisodeSlug, activeKey]);

    const hasValidEpisodes =
        movie?.episode &&
        movie.episode.length > 0 &&
        movie.episode[0].serverData &&
        movie.episode[0].serverData.length > 0 &&
        (movie.episode[0].serverData[0].linkM3u8 || movie.episode[0].serverData[0].linkEmbed);

    const findEpisodeInServer = useCallback(
        (serverData: EpisodeServerDataType[], targetSlug: string): EpisodeServerDataType | null => {
            return serverData.find((ep) => ep.slug === targetSlug) || null;
        },
        [],
    );

    const handleServerChange = useCallback(
        (newServerIndex: number) => {
            setActiveKey(newServerIndex.toString());
            if (onServerChange) {
                onServerChange(newServerIndex);
            }

            if (hasValidEpisodes) {
                const newServer = movie.episode[newServerIndex];
                const currentEpisode = findEpisodeInServer(
                    newServer.serverData,
                    activeEpisodeSlug || '',
                );

                if (currentEpisode) {
                    // If the current episode exists in the new server, navigate to it
                    router.push(
                        `/phim/${movie.slug}/${currentEpisode.slug}?server=${newServerIndex}`,
                    );
                } else {
                    // If not found, navigate to the first episode of the new server
                    const firstEpisode = newServer?.serverData[0];
                    router.push(
                        `/phim/${movie.slug}/${firstEpisode.slug}?server=${newServerIndex}`,
                    );
                }
            }
        },
        [movie, activeEpisodeSlug, onServerChange, hasValidEpisodes, findEpisodeInServer, router],
    );

    const renderEpisodes = (serverIndex: number) => {
        if (!hasValidEpisodes && !movie?.trailerUrl) {
            return (
                <Alert
                    message="Phim đang cập nhật..."
                    description="Tập phim đang cập nhật, vui lòng quay lại sau."
                    type="info"
                    showIcon
                />
            );
        }

        const episodes = hasValidEpisodes ? movie.episode[serverIndex].serverData : [];

        return (
            <div
                ref={episodeListRef}
                style={{ maxHeight: '20rem', overflowY: 'auto', padding: '0.5rem' }}
            >
                {showTrailerAsFirstEpisode && movie.trailerUrl && (
                    <Link
                        href={`/phim/${movie.slug}/trailer`}
                        ref={activeEpisodeSlug === 'trailer' ? activeEpisodeRef : null}
                    >
                        <Button type={activeEpisodeSlug === 'trailer' ? 'primary' : 'default'}>
                            Trailer
                        </Button>
                    </Link>
                )}
                {episodes.map((item, index) => (
                    <Link
                        key={`serverData-${item.slug}-${index}`}
                        href={`/phim/${movie.slug}/${item.slug}${
                            serverIndex && serverIndex > 0 ? `?server=${serverIndex}` : ''
                        }`}
                        ref={activeEpisodeSlug === item.slug ? activeEpisodeRef : null}
                    >
                        <Button
                            type={activeEpisodeSlug === item.slug ? 'primary' : 'default'}
                            style={{ margin: '0.3rem' }}
                        >
                            {item.name}
                        </Button>
                    </Link>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        if (!showServers || !hasValidEpisodes) {
            return renderEpisodes(0);
        }

        return (
            <Tabs
                activeKey={activeKey}
                onChange={(key) => handleServerChange(parseInt(key))}
                items={movie.episode.map((ep: EpisodeType, index: number) => ({
                    key: index.toString(),
                    label: ep.serverName,
                    children: renderEpisodes(index),
                }))}
            />
        );
    };

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                components: {
                    Tabs: {
                        itemSelectedColor: '#fff',
                        itemHoverColor: 'primary',
                    },
                },
            }}
        >
            <div style={{ background: 'rgb(25, 25, 25)', padding: '1rem', borderRadius: '1rem' }}>
                <Title level={4} style={{ color: '#fff', marginBottom: '1rem' }}>
                    Danh sách tập
                </Title>
                {renderContent()}
            </div>
        </ConfigProvider>
    );
}
