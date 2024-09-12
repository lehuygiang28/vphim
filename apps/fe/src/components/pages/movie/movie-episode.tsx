import { Button, Divider, Flex, Typography } from 'antd';
import { getEpisodesWithMaxServerDataLength } from '@/libs/utils/common';

import { MovieType } from 'apps/api/src/app/movies/movie.type';

const { Title } = Typography;

export type MovieEpisodeProps = {
    movie: MovieType;
};

export function MovieEpisode({ movie }: MovieEpisodeProps) {
    return (
        <>
            <Divider orientation="left" style={{ borderColor: '#fff' }}>
                <Title level={4}>Danh sách tập</Title>
            </Divider>
            <div
                style={{
                    maxHeight: '20rem',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Flex wrap gap={10}>
                    {movie?.episode && movie?.episode?.length > 0 ? (
                        getEpisodesWithMaxServerDataLength(movie)?.serverData?.map((item) => (
                            <Button
                                key={item.slug}
                                type="default"
                                href={`/phim/${movie.slug}/${item.slug}`}
                                style={{ marginBottom: '5px' }}
                            >
                                {item.name}
                            </Button>
                        ))
                    ) : (
                        <>
                            {movie?.trailerUrl && (
                                <Button
                                    key={movie.slug}
                                    type="default"
                                    href={`/phim/${movie.slug}/trailer`}
                                    style={{ marginBottom: '5px' }}
                                >
                                    Trailer
                                </Button>
                            )}
                        </>
                    )}
                </Flex>
            </div>
        </>
    );
}
