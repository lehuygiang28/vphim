'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOne } from '@refinedev/core';
import { Typography, Grid } from 'antd';
import { GET_MOVIE_QUERY } from '@/queries/movies';

import { MovieType, EpisodeServerDataType } from 'apps/api/src/app/movies/movie.type';
import { MovieEpisode } from '../movie-episode';
import { MovieRelated } from '../movie-related';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export type MoviePlayProps = {
    params: { movieSlug: string; episodeSlug: string };
};

export function MoviePlay({ params }: MoviePlayProps) {
    const { movieSlug, episodeSlug } = params;
    const router = useRouter();
    const { md } = useBreakpoint();

    const [selectedServerIndex, setSelectedServerIndex] = useState<number>(0);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeServerDataType | null>(null);

    const { data: movie } = useOne<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        meta: {
            gqlQuery: GET_MOVIE_QUERY,
            operation: 'movie',
        },
        id: movieSlug,
    });

    useEffect(() => {
        if (movie?.data?.episode) {
            const episode = movie.data.episode.find((ep) =>
                ep.serverData.some((server) => server.slug === episodeSlug),
            );
            if (episode) {
                const serverIndex = movie.data.episode.findIndex(
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
        const newEpisode = movie?.data?.episode?.[serverIndex]?.serverData[0];
        if (newEpisode) {
            setSelectedEpisode(newEpisode);
            router.push(
                `/phim/${encodeURIComponent(movieSlug)}/${encodeURIComponent(newEpisode.slug)}`,
            );
        }
    };

    return (
        <>
            <Title level={4}>
                {movie?.data?.name} - {selectedEpisode?.name}
            </Title>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: 20,
                    width: md ? '90vw' : '100%',
                    height: md ? '80vh' : '35vh',
                }}
            >
                {selectedEpisode?.linkEmbed && (
                    <iframe
                        width="100%"
                        height="100%"
                        src={selectedEpisode.linkEmbed}
                        title="Embedded Video"
                        allowFullScreen
                        style={{ border: 'none' }}
                    />
                )}
            </div>
            {movie && (
                <MovieEpisode
                    movie={movie?.data}
                    activeEpisodeSlug={episodeSlug}
                    activeServerIndex={selectedServerIndex}
                    showServers={true}
                    onServerChange={handleServerChange}
                    useServersDivider={true}
                    useEpisodesDivider={false}
                />
            )}
            {movie && (
                <div style={{ marginTop: '2rem', marginBottom: md ? '4rem' : '2rem' }}>
                    <MovieRelated movie={movie?.data} />
                </div>
            )}
        </>
    );
}
