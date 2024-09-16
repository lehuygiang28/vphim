import './movie-episode.css';

import Link from 'next/link';
import { Button, Divider, Flex, Typography, Grid, Alert } from 'antd';
import { randomString } from '@/libs/utils/common';
import type { MovieType, EpisodeType } from 'apps/api/src/app/movies/movie.type';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export type MovieEpisodeProps = {
    movie: MovieType;
    activeEpisodeSlug?: string;
    activeServerIndex?: number;
    showServers?: boolean;
    onServerChange?: (index: number) => void;
    useServersDivider?: boolean;
    useEpisodesDivider?: boolean;
    showTrailerAsFirstEpisode?: boolean;
};

export function MovieEpisode({
    movie,
    activeEpisodeSlug,
    activeServerIndex = 0,
    showServers = false,
    onServerChange,
    useServersDivider = true,
    useEpisodesDivider = true,
    showTrailerAsFirstEpisode = true,
}: MovieEpisodeProps) {
    const { md } = useBreakpoint();

    const renderDivider = (title: string, useDivider: boolean) => {
        if (useDivider) {
            return (
                <Divider orientation="left">
                    <Title level={4}>{title}</Title>
                </Divider>
            );
        }
        return <Title level={4}>{title}</Title>;
    };

    const hasValidEpisodes =
        movie?.episode &&
        movie.episode.length > 0 &&
        movie.episode[0].serverData &&
        movie.episode[0].serverData.length > 0 &&
        movie.episode[0].serverData[0].linkM3u8;

    const renderContent = () => {
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

        return (
            <div
                style={{
                    maxHeight: '20rem',
                    overflowY: 'auto',
                }}
            >
                <Flex wrap gap={md ? 10 : 5}>
                    {showTrailerAsFirstEpisode && movie.trailerUrl && (
                        <Link
                            href={`/phim/${movie.slug}/trailer`}
                            style={{ marginBottom: md ? '5px' : '2px' }}
                        >
                            <Button type={activeEpisodeSlug === 'trailer' ? 'primary' : 'default'}>
                                Trailer
                            </Button>
                        </Link>
                    )}
                    {hasValidEpisodes ? (
                        movie.episode[activeServerIndex].serverData.map((item, index) => (
                            <Link
                                key={`serverData-${item.slug}-${index}`}
                                href={`/phim/${movie.slug}/${item.slug}`}
                                style={{ marginBottom: md ? '5px' : '2px' }}
                            >
                                <Button
                                    type={activeEpisodeSlug === item.slug ? 'primary' : 'default'}
                                >
                                    {item.name}
                                </Button>
                            </Link>
                        ))
                    ) : !showTrailerAsFirstEpisode && movie.trailerUrl ? (
                        <Link href={`/phim/${movie.slug}/trailer`}>
                            <Button
                                key={movie.slug}
                                type={activeEpisodeSlug === 'trailer' ? 'primary' : 'default'}
                            >
                                Trailer
                            </Button>
                        </Link>
                    ) : null}
                </Flex>
            </div>
        );
    };

    return (
        <>
            {showServers && hasValidEpisodes && (
                <>
                    {renderDivider('Chọn máy chủ', useServersDivider)}
                    <Flex wrap gap={10} style={{ marginBottom: '1rem' }}>
                        {movie?.episode?.map((ep: EpisodeType, index: number) => (
                            <Button
                                key={`server-${randomString(5)}-${index}`}
                                onClick={() => onServerChange && onServerChange(index)}
                                type={activeServerIndex === index ? 'primary' : 'default'}
                            >
                                {ep.serverName}
                            </Button>
                        ))}
                    </Flex>
                </>
            )}

            {renderDivider('Danh sách tập', useEpisodesDivider)}
            {renderContent()}
        </>
    );
}
