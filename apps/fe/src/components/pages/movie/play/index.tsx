'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Typography, Grid, Divider } from 'antd';

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

    const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);

    useEffect(() => {
        if (movie?.episode) {
            const episode = movie.episode.find((ep) =>
                ep.serverData.some((server) => server.slug === episodeSlug),
            );
            if (episode) {
                const serverIndex = movie.episode.findIndex(
                    (ep) => ep.serverName === episode.serverName,
                );
                setSelectedServerIndex(serverIndex);
                setSelectedEpisode(
                    episode.serverData.find((server) => server.slug === episodeSlug) || null,
                );
            }
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

    return (
        <>
            <div
                style={{
                    position: 'relative',
                    width: '90vw',
                    maxWidth: '1600px',
                    margin: '0 auto',
                    paddingTop: 'calc(80vw * 9 / 16)', // This creates the 16:9 aspect ratio
                    height: 0, // Height is controlled by padding-top
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        maxHeight: md ? '90vh' : '25vh',
                        overflow: 'hidden',
                    }}
                >
                    {selectedEpisode?.linkM3u8 && (
                        <iframe
                            width="100%"
                            height="100%"
                            src={
                                selectedEpisode?.linkM3u8
                                    ? `${host}/player/${encodeURIComponent(
                                          selectedEpisode.linkM3u8,
                                      )}?poster=${encodeURIComponent(
                                          movie?.thumbUrl?.includes('/phimimg.com/upload')
                                              ? movie?.thumbUrl
                                              : movie?.posterUrl,
                                      )}&m=${encodeURIComponent(
                                          movie?.slug,
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
                            <>
                                <Link
                                    href={`${RouteNameEnum.MOVIE_PAGE}/${encodeURIComponent(
                                        movie?.slug,
                                    )}`}
                                >
                                    <Text type="warning">Xem Thêm</Text>
                                </Link>
                            </>
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
        </>
    );
}
