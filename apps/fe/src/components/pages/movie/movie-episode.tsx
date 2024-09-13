import Link from 'next/link';
import { Button, Divider, Flex, Typography } from 'antd';
import type { MovieType, EpisodeType } from 'apps/api/src/app/movies/movie.type';

const { Title } = Typography;

export type MovieEpisodeProps = {
    movie: MovieType;
    activeEpisodeSlug?: string;
    activeServerIndex?: number;
    showServers?: boolean;
    onServerChange?: (index: number) => void;
    useServersDivider?: boolean;
    useEpisodesDivider?: boolean;
};

export function MovieEpisode({
    movie,
    activeEpisodeSlug,
    activeServerIndex = 0,
    showServers = false,
    onServerChange,
    useServersDivider = true,
    useEpisodesDivider = true,
}: MovieEpisodeProps) {
    const renderDivider = (title: string, useDivider: boolean) => {
        if (useDivider) {
            return (
                <Divider orientation="left" style={{ borderColor: '#fff' }}>
                    <Title level={4}>{title}</Title>
                </Divider>
            );
        }
        return <Title level={4}>{title}</Title>;
    };

    return (
        <>
            {showServers && (
                <>
                    {renderDivider('Chọn máy chủ', useServersDivider)}
                    <Flex wrap gap={10} style={{ marginBottom: '1rem' }}>
                        {movie?.episode?.map((ep: EpisodeType, index: number) => (
                            <Button
                                key={`server-${index}`}
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
            <div
                style={{
                    maxHeight: '20rem',
                    overflowY: 'auto',
                    padding: '0.5rem',
                }}
            >
                <Flex wrap gap={10}>
                    {movie?.episode && movie?.episode?.length > 0
                        ? movie?.episode?.[activeServerIndex]?.serverData?.map((item) => (
                              <Link
                                  key={item.slug}
                                  href={`/phim/${movie.slug}/${item.slug}`}
                                  style={{ marginBottom: '5px' }}
                              >
                                  <Button
                                      type={activeEpisodeSlug === item.slug ? 'primary' : 'default'}
                                  >
                                      {item.name}
                                  </Button>
                              </Link>
                          ))
                        : movie?.trailerUrl && (
                              <Link
                                  href={`/phim/${movie.slug}/trailer`}
                                  style={{ marginBottom: '5px' }}
                              >
                                  <Button key={movie.slug} type="default">
                                      Trailer
                                  </Button>
                              </Link>
                          )}
                </Flex>
            </div>
        </>
    );
}
