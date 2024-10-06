'use client';

import React, { FC } from 'react';
import Link from 'next/link';
import { Button, Card, Divider, Grid, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, PlayCircleOutlined } from '@ant-design/icons';

import { ImageOptimized } from '@/components/image/image-optimized';
import { MovieQualityTag } from '@/components/tag/movie-quality';
import { truncateText } from '@/libs/utils/movie.util';
import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos/movie-response.dto';

const { Text, Paragraph, Title } = Typography;
const { useBreakpoint } = Grid;

const MAX_LENGTH_MOVIE_NAME = 60;

interface MovieCardProps {
    movie: MovieResponseDto;
    visibleContent?: boolean;
    scale?: number;
}

export const MovieCard: FC<MovieCardProps> = ({ movie, visibleContent, scale = 1.25 }) => {
    const { md } = useBreakpoint();

    return (
        <>
            <Card
                hoverable
                style={{
                    position: 'relative',
                    maxWidth: '14rem',
                    maxHeight: '21rem',
                    width: '100%',
                    height: '100%',
                    transition: 'all 0.3s ease-in-out',
                    background: 'none',
                    border: 'none',
                    transform: visibleContent ? `scale(${scale})` : 'scale(1)',
                    zIndex: visibleContent ? 100 : 1,
                }}
                styles={{
                    body: { padding: 0, height: '100%', width: '100%' },
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        background: 'black',
                        overflow: 'hidden',
                        borderRadius: '0.3rem',
                    }}
                >
                    <ImageOptimized
                        alt={movie.name}
                        url={movie.thumbUrl}
                        width={480}
                        height={854}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    />
                    <Tag
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            color: 'white',
                            fontWeight: 'bold',
                            background: 'rgba(133, 78, 202, 0.8)',
                            border: 'none',
                        }}
                    >
                        {movie.episodeCurrent}
                    </Tag>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '70%',
                            padding: 6,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: 'rgba(0, 0, 0, 0.8)',
                            transition: 'opacity 0.3s',
                            borderRadius: '0 0 0.3rem 0.3rem',
                            opacity: visibleContent ? 1 : 0,
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Paragraph
                                style={{
                                    color: 'white',
                                    fontSize: md ? '1rem' : '0.7rem',
                                    marginBottom: '0.3rem',
                                    lineHeight: md ? '1.2rem' : '0.9rem',
                                }}
                            >
                                {movie.name}
                            </Paragraph>
                            <Paragraph
                                type="secondary"
                                ellipsis={{ rows: 2, expandable: false }}
                                style={{
                                    fontSize: md ? '0.7rem' : '0.5rem',
                                    lineHeight: md ? '0.85rem' : '0.7rem',
                                    marginBottom: 0,
                                    color: '#a6a6a6',
                                }}
                            >
                                {movie.originName}
                            </Paragraph>
                            {md && (
                                <div
                                    style={{
                                        marginTop: '0.3rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    <MovieQualityTag
                                        style={{ marginRight: 4, fontSize: '0.6rem' }}
                                        quality={movie?.quality || ''}
                                    />
                                    <Divider
                                        type="vertical"
                                        style={{ height: '0.8rem', background: '#a6a6a6' }}
                                    />
                                    <Text style={{ fontSize: '0.6rem', color: '#a6a6a6' }}>
                                        <CalendarOutlined /> {movie.year}
                                    </Text>
                                    <Divider
                                        type="vertical"
                                        style={{ height: '0.8rem', background: '#a6a6a6' }}
                                    />
                                    <Text style={{ fontSize: '0.6rem', color: '#a6a6a6' }}>
                                        {movie.episodeCurrent}
                                    </Text>
                                </div>
                            )}
                            <Paragraph
                                ellipsis={{
                                    rows: movie.name.length > 25 ? 3 : 5,
                                    expandable: false,
                                }}
                                style={{
                                    color: '#a6a6a6',
                                    fontSize: md ? '0.7rem' : '0.6rem',
                                    lineHeight: '1rem',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    marginTop: md ? '0.3rem' : '0',
                                }}
                            >
                                {movie.content}
                            </Paragraph>
                        </Space>
                        <Link href={`/phim/${movie.slug}`}>
                            <Button
                                type="primary"
                                size="small"
                                icon={<PlayCircleOutlined />}
                                style={{ width: '100%', fontSize: md ? '0.8rem' : '0.6rem' }}
                            >
                                Xem ngay
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>
            <Title level={5} style={{ lineHeight: '1.2rem', marginTop: '0.3rem' }}>
                {movie?.name && truncateText(movie.name, MAX_LENGTH_MOVIE_NAME)}
            </Title>
        </>
    );
};
