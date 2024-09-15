'use client';

import React, { useEffect, useState } from 'react';
import { Button, Col, Grid, Row, Space, Tag, Typography, Tooltip } from 'antd';
import { useOne, useUpdate } from '@refinedev/core';
import { MovieType } from 'apps/api/src/app/movies/movie.type';
import {
    CalendarOutlined,
    EyeOutlined,
    HeartFilled,
    HeartOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';

import { HigherHeightImage } from '@/components/image/higher-image';
import { GET_MOVIE_QUERY } from '@/queries/movies';
import { MovieQualityTag } from '@/components/tag/movie-quality';
import { movieTypeTranslations, movieStatusTranslations } from '@/constants/translation-enum';

import { MovieTypeEnum, MovieStatusEnum } from 'apps/api/src/app/movies/movie.constant';
import { MovieEpisode } from './movie-episode';
import { MovieRelated } from './movie-related';
import Link from 'next/link';
import { UserType } from 'apps/api/src/app/users/user.type';
import {
    FOLLOW_MOVIE_MUTATION,
    GET_OWN_FOLLOWING_MOVIES,
    UNFOLLOW_MOVIE_MUTATION,
} from '@/queries/users';
import { getFirstEpisodeSlug } from '@/libs/utils/movie.util';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const InfoItem = ({
    title,
    content,
    md = false,
}: {
    title: string;
    content: React.ReactNode;
    md?: boolean;
}) => (
    <Paragraph
        ellipsis={{ rows: 5, expandable: false }}
        style={{ maxWidth: md ? '50vw' : '100vw', marginBottom: '0.1rem' }}
    >
        <Title
            italic
            type="secondary"
            level={5}
            style={{ display: 'inline-block', marginBottom: '0' }}
        >
            {title}:
        </Title>
        {'  '}
        <Text>{content}</Text>
    </Paragraph>
);

export type MovieProps = {
    slug: string;
};

export function Movie({ slug }: MovieProps) {
    const { md } = useBreakpoint();
    const [isFollowing, setIsFollowing] = useState(false);

    const { data: { data: movie } = {} } = useOne<MovieType>({
        dataProviderName: 'graphql',
        resource: 'movies',
        id: slug,
        meta: {
            gqlQuery: GET_MOVIE_QUERY,
            operation: 'movie',
            variables: {
                input: {
                    slug,
                },
            },
        },
    });
    const { data: { data: followMovies } = {} } = useOne<Pick<UserType, 'followMovies'>>({
        dataProviderName: 'graphql',
        resource: 'users',
        id: 'me',
        meta: {
            gqlQuery: GET_OWN_FOLLOWING_MOVIES,
            operation: 'getMe',
        },
    });
    const { mutate: updateUser } = useUpdate({
        dataProviderName: 'graphql',
        resource: 'users',
        successNotification: false,
        errorNotification: false,
        mutationMode: 'optimistic',
    });

    useEffect(() => {
        if (followMovies?.followMovies?.find((movie) => movie?.slug === slug)) {
            setIsFollowing(true);
        } else {
            setIsFollowing(false);
        }
    }, [followMovies, slug]);

    const handleFollowMovie = (movie: MovieType, follow: boolean) => {
        if (follow) {
            updateUser({
                id: 'me',
                values: {},
                mutationMode: 'optimistic',
                meta: {
                    gqlMutation: FOLLOW_MOVIE_MUTATION,
                    operation: 'followMovie',
                    variables: {
                        input: {
                            movieSlug: movie.slug,
                        },
                    },
                },
                successNotification: {
                    message: 'Đã theo dõi phim thành công',
                    type: 'success',
                    key: 'followMovie',
                },
            });
        } else {
            updateUser({
                id: 'me',
                values: {},
                mutationMode: 'optimistic',
                meta: {
                    gqlMutation: UNFOLLOW_MOVIE_MUTATION,
                    operation: 'unfollowMovie',
                    variables: {
                        input: {
                            movieSlug: movie.slug,
                        },
                    },
                },
                successNotification: {
                    message: 'Bỏ theo dõi phim thành công',
                    type: 'success',
                    key: 'unfollowMovie',
                },
            });
        }
    };

    const renderMovieInfoSection = () => {
        return (
            <Space size={0} direction="vertical" className="movieInfo">
                <InfoItem
                    md={md}
                    title="Chiếu rạp"
                    content={movie?.cinemaRelease ? 'Có' : 'Không'}
                />
                <InfoItem
                    md={md}
                    title="Diễn viên"
                    content={movie?.actors?.map((actor) => actor?.name).join(', ')}
                />
                <InfoItem
                    md={md}
                    title="Quốc gia"
                    content={movie?.countries?.map((country) => country?.name).join(', ')}
                />
                <InfoItem
                    md={md}
                    title="Thể loại"
                    content={movie?.categories?.map((c) => c?.name)?.join(', ')}
                />
                <InfoItem
                    md={md}
                    title="Định dạng"
                    content={
                        movie?.type && movieTypeTranslations[movie.type as MovieTypeEnum]
                            ? movieTypeTranslations[movie.type as MovieTypeEnum]
                            : 'N/A'
                    }
                />
                <InfoItem
                    md={md}
                    title="Trạng thái"
                    content={
                        movie?.status && movieStatusTranslations[movie.status as MovieStatusEnum]
                            ? movieStatusTranslations[movie.status as MovieStatusEnum]
                            : 'N/A'
                    }
                />
                {movie?.directors && movie?.directors?.length > 0 && (
                    <InfoItem
                        md={md}
                        title="Đạo diễn"
                        content={movie?.directors?.map((d) => d?.name).join(', ')}
                    />
                )}
                <InfoItem md={md} title="Thời lượng" content={movie?.time} />
                <InfoItem md={md} title="Tóm tắt" content={movie?.content} />
            </Space>
        );
    };

    return (
        <>
            {movie && (
                <div
                    style={{
                        filter: 'blur(1rem) brightness(0.8)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: md ? '85vh' : '35vh',
                        zIndex: 0,
                        transition: 'opacity 0.5s ease-in-out',
                    }}
                >
                    <HigherHeightImage
                        url1={movie?.thumbUrl || ''}
                        url2={movie?.posterUrl || ''}
                        alt={movie?.name || ''}
                        width={md ? 1900 : 750}
                        height={md ? 750 : 380}
                        reverse={true}
                    />
                </div>
            )}
            <Space
                direction="vertical"
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    textAlign: 'left',
                    zIndex: 1,
                    width: '100%',
                }}
            >
                <Row
                    justify="center"
                    align={md ? 'middle' : 'top'}
                    style={{ width: '100%', height: '100%', minHeight: '36vh' }}
                >
                    <Col
                        xs={{ span: 10, order: 1 }}
                        md={{ span: 6, order: 2 }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                position: 'relative',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                                textAlign: 'center',
                                background: 'transparent',
                            }}
                        >
                            {(movie?.thumbUrl || movie?.posterUrl) && (
                                <div
                                    style={{
                                        height: md ? '60vh' : '36vh',
                                    }}
                                >
                                    <HigherHeightImage
                                        url1={movie?.thumbUrl || ''}
                                        url2={movie?.posterUrl || ''}
                                        alt={movie?.name || ''}
                                        width={md ? 500 : 150}
                                        height={md ? 745 : 200}
                                        style={{
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                            transition: 'transform 0.5s ease',
                                            width: '100%',
                                            height: '100%',
                                            maxWidth: md ? '20rem' : '9rem',
                                            maxHeight: md ? '27rem' : '13rem',
                                            objectFit: 'cover',
                                            display: 'block',
                                            margin: 'auto',
                                            background: 'transparent',
                                        }}
                                        className="posterImage"
                                    />
                                </div>
                            )}
                        </div>
                    </Col>
                    <Col xs={{ span: 14, order: 2 }} md={{ span: 18, order: 1 }}>
                        <div
                            style={{
                                padding: '0',
                                color: '#fff',
                                textAlign: 'left',
                                marginTop: md ? undefined : '5rem',
                            }}
                            className="textContent"
                        >
                            <Space direction="vertical" size={md ? 'middle' : 'small'}>
                                <div>
                                    <Title level={md ? 1 : 4} style={{ marginBottom: '0' }}>
                                        {movie?.name}
                                    </Title>
                                    <Text type="secondary">{movie?.originName}</Text>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <Space wrap size={[8, 8]}>
                                            <MovieQualityTag quality={movie?.quality || 'N/A'} />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                |
                                            </Text>
                                            <Space size={2}>
                                                <CalendarOutlined style={{ fontSize: 12 }} />
                                                <Text style={{ fontSize: 12 }}>
                                                    {movie?.year || 'N/A'}
                                                </Text>
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                |
                                            </Text>
                                            <Space
                                                size={2}
                                                style={{
                                                    maxWidth: '100%',
                                                    display: 'inline-flex',
                                                }}
                                            >
                                                <EyeOutlined style={{ fontSize: 12 }} />{' '}
                                                <Text
                                                    style={{
                                                        fontSize: 12,
                                                        wordBreak: 'break-word',
                                                        whiteSpace: 'normal',
                                                    }}
                                                >
                                                    {movie?.view?.toLocaleString() || 'N/A'}
                                                </Text>
                                            </Space>
                                        </Space>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        {movie?.categories?.map((category) => (
                                            <Tag
                                                key={category?.slug}
                                                style={{
                                                    fontSize: md ? '0.7rem' : '0.5rem',
                                                    background: 'rgba(0 0 0 / 0.4)',
                                                    border: 'none',
                                                }}
                                            >
                                                {category?.name}
                                            </Tag>
                                        ))}
                                    </div>
                                </div>
                                {md && renderMovieInfoSection()}
                                <Row gutter={[8, 8]} style={{ width: md ? '30%' : 'auto' }}>
                                    <Col span={18}>
                                        <Link
                                            href={`/phim/${movie?.slug}/${getFirstEpisodeSlug(
                                                movie,
                                            )}`}
                                        >
                                            <Button
                                                type="primary"
                                                size="middle"
                                                icon={<PlayCircleOutlined />}
                                                style={{
                                                    width: '100%',
                                                }}
                                            >
                                                Xem ngay
                                            </Button>
                                        </Link>
                                    </Col>
                                    <Col span={6}>
                                        <Tooltip
                                            title={`${
                                                isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'
                                            } phim`}
                                            trigger={'hover'}
                                        >
                                            <Button
                                                type="default"
                                                size="middle"
                                                style={{
                                                    width: '100%',
                                                }}
                                                onClick={() =>
                                                    handleFollowMovie(movie, !isFollowing)
                                                }
                                            >
                                                {isFollowing ? (
                                                    <HeartFilled style={{ color: 'red' }} />
                                                ) : (
                                                    <HeartOutlined />
                                                )}
                                            </Button>
                                        </Tooltip>
                                    </Col>
                                </Row>
                            </Space>
                        </div>
                    </Col>
                </Row>
                {!md && (
                    <Row>
                        <Col span={24}>{renderMovieInfoSection()}</Col>
                    </Row>
                )}
                {movie && (
                    <Row>
                        <Col span={24}>
                            <MovieEpisode movie={movie} />
                        </Col>
                    </Row>
                )}
                {movie && (
                    <Row style={{ marginTop: '2rem', marginBottom: md ? '4rem' : '2rem' }}>
                        <Col span={24}>
                            <MovieRelated movie={movie} />
                        </Col>
                    </Row>
                )}
            </Space>
        </>
    );
}
