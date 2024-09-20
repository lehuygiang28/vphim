'use client';

import './movie-episode.css';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Tabs, Button, Typography, Alert, ConfigProvider, theme } from 'antd';
import type { MovieType, EpisodeType } from 'apps/api/src/app/movies/movie.type';

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
                        href={`/phim/${movie.slug}/${item.slug}`}
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
                onChange={(key) => {
                    setActiveKey(key);
                    onServerChange && onServerChange(parseInt(key));
                }}
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
            <div style={{ background: '#141414', padding: '1rem', borderRadius: '8px' }}>
                <Title level={4} style={{ color: '#fff', marginBottom: '1rem' }}>
                    Danh sách tập
                </Title>
                {renderContent()}
            </div>
        </ConfigProvider>
    );
}
