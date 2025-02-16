'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Col, Grid, Row, Space, Tag, Typography, Tooltip, Breadcrumb } from 'antd';
import { useGetIdentity, useOne, useUpdate } from '@refinedev/core';
import {
    CalendarOutlined,
    EyeOutlined,
    HeartFilled,
    HeartOutlined,
    HomeOutlined,
    PlayCircleOutlined,
} from '@ant-design/icons';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';
import type { UserType } from 'apps/api/src/app/users/user.type';
import { MovieTypeEnum, MovieStatusEnum } from 'apps/api/src/app/movies/movie.constant';

import { ImageOptimized } from '@/components/image/image-optimized';
import { GET_MOVIE_QUERY } from '@/queries/movies';
import { MovieQualityTag } from '@/components/tag/movie-quality';
import { movieTypeTranslations, movieStatusTranslations } from '@/constants/translation-enum';
import {
    FOLLOW_MOVIE_MUTATION,
    GET_OWN_FOLLOWING_MOVIES,
    UNFOLLOW_MOVIE_MUTATION,
} from '@/queries/users';
import { getFirstEpisodeSlug } from '@/libs/utils/movie.util';
import { IMDBRating } from '@/components/card/imdb-rating';
import { TMDBRating } from '@/components/card/tmdb-rating';
import { MovieEpisode } from './movie-episode';
const MovieRelated = dynamic(() => import('./movie-related').then((mod) => mod.MovieRelated), {
    ssr: true,
});
const MovieComments = dynamic(() => import('./movie-comment'), { ssr: true });

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const InfoItem = ({
    title,
    content,
    md = false,
    ellipsis = true,
}: {
    title: string;
    content: React.ReactNode;
    md?: boolean;
    ellipsis?: boolean;
}) => (
    <Paragraph
        ellipsis={ellipsis ? { rows: 5, expandable: false } : false}
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
    movie?: MovieType;
};

export function Movie({ slug, movie: movieProp }: MovieProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { md } = useBreakpoint();
    const [isFollowing, setIsFollowing] = useState(false);

    const { data: { data: movieQuery } = {} } = useOne<MovieType>({
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
        queryOptions: {
            enabled: movieProp === undefined && slug !== undefined,
        },
    });

    const movie = movieQuery ?? movieProp;
    const { data: user } = useGetIdentity<UserType>();
    const { data: { data: followMovies } = {} } = useOne<Pick<UserType, 'followMovies'>>({
        dataProviderName: 'graphql',
        resource: 'users',
        id: 'me',
        meta: {
            gqlQuery: GET_OWN_FOLLOWING_MOVIES,
            operation: 'getMe',
        },
        successNotification: false,
        errorNotification: false,
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
        if (!user) {
            router.push(`/dang-nhap?title=follow&to=${encodeURIComponent(pathname)}`);
            return;
        }

        // Optimistically update the UI
        setIsFollowing(follow);

        const operation = follow ? 'followMovie' : 'unfollowMovie';
        const mutation = follow ? FOLLOW_MOVIE_MUTATION : UNFOLLOW_MOVIE_MUTATION;
        const successMessage = follow
            ? 'Đã thêm phim vào tủ thành công'
            : 'Xóa phim khỏi tủ thành công';

        updateUser(
            {
                id: 'me',
                values: {},
                mutationMode: 'optimistic',
                meta: {
                    gqlMutation: mutation,
                    operation: operation,
                    variables: {
                        input: {
                            movieSlug: movie.slug,
                        },
                    },
                },
                successNotification: {
                    message: successMessage,
                    type: 'success',
                    key: operation,
                },
            },
            {
                onError: () => {
                    // Revert the optimistic update if there's an error
                    setIsFollowing(!follow);
                },
            },
        );
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
                <InfoItem md={md} title="Tóm tắt" content={movie?.content} ellipsis={false} />
            </Space>
        );
    };

    return (
        <>
            {movie && (
                <div
                    style={{
                        filter: 'blur(1rem) brightness(0.2)',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: md ? '85vh' : '35vh',
                        maxHeight: md ? '85vh' : '35vh',
                        zIndex: 0,
                        transition: 'opacity 0.5s ease-in-out',
                    }}
                >
                    <ImageOptimized
                        url={movie?.posterUrl}
                        alt={movie?.name || ''}
                        width={md ? 960 : 640}
                        height={md ? 540 : 360}
                        style={{
                            maxHeight: md ? '85vh' : '35vh',
                        }}
                        quality={20}
                    />
                </div>
            )}
            <Space
                direction="vertical"
                style={{
                    position: 'relative',
                    textAlign: 'left',
                    zIndex: 1,
                    width: '100%',
                }}
            >
                <Breadcrumb
                    style={{ marginBottom: '1rem' }}
                    items={[
                        {
                            title: (
                                <Link href={'/'}>
                                    <HomeOutlined style={{ marginRight: '0.5rem' }} />
                                    Trang chủ
                                </Link>
                            ),
                        },
                        {
                            title: <Link href={'/danh-sach-phim'}>Danh sách phim</Link>,
                        },
                        {
                            title: <Link href={`/phim/${movie?.slug}`}>{movie?.name}</Link>,
                        },
                    ]}
                />
                <Row
                    justify="center"
                    style={{
                        width: '100%',
                        height: '100%',
                        minHeight: md ? '36vh' : '28vh',
                    }}
                    gutter={[16, 16]}
                >
                    <Col xs={{ span: 10, order: 1 }} md={{ span: 6, order: 2 }}>
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
                                        height: '100%',
                                    }}
                                >
                                    <ImageOptimized
                                        url={movie?.posterUrl || movie?.thumbUrl}
                                        alt={movie?.name || ''}
                                        width={480}
                                        height={854}
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
                                        disableSkeleton
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
                            }}
                            className="textContent"
                        >
                            <Space
                                direction="vertical"
                                size={md ? 'middle' : 'small'}
                                styles={{
                                    item: {
                                        minWidth: '30vw',
                                    },
                                }}
                            >
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
                                                    {movie?.view?.toLocaleString() || '0'}
                                                </Text>
                                            </Space>
                                        </Space>
                                    </div>
                                    {(movie?.tmdb?.id || movie?.imdb?.id) && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            {movie?.imdb?.id && (
                                                <IMDBRating
                                                    id={movie?.imdb?.id}
                                                    size={md ? 'middle' : 'small'}
                                                />
                                            )}
                                            {movie?.tmdb?.id && (
                                                <TMDBRating
                                                    id={movie?.tmdb?.id}
                                                    type={movie?.tmdb?.type}
                                                    size={md ? 'middle' : 'small'}
                                                />
                                            )}
                                        </div>
                                    )}

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
                                                isFollowing ? 'Xóa khỏi' : 'Thêm vào'
                                            } tủ phim`}
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
                        <Col span={24} style={{ marginTop: '2rem' }}>
                            <MovieEpisode movie={movie} showServers={false} />
                        </Col>
                    </Row>
                )}
                {movie && (
                    <>
                        <Row>
                            <Col span={24}>
                                <MovieComments movieId={movie?._id?.toString()} />
                            </Col>
                        </Row>
                        <Row style={{ marginTop: '2rem', marginBottom: '4rem' }}>
                            <Col span={24}>
                                <MovieRelated movie={movie} />
                            </Col>
                        </Row>
                    </>
                )}
            </Space>
        </>
    );
}
