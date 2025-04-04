'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Col, Grid, Row, Space, Tag, Typography, Tooltip, Breadcrumb, Divider } from 'antd';
import { useGetIdentity, useOne, useUpdate } from '@refinedev/core';
import {
    CalendarOutlined,
    EyeOutlined,
    HeartFilled,
    HeartOutlined,
    HomeOutlined,
    PlayCircleOutlined,
    SearchOutlined,
    TagsOutlined,
    TeamOutlined,
    UserOutlined,
    GlobalOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
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
import { stringifyTableParams } from '@/libs/utils/url.util';
import { RouteNameEnum } from '@/constants/route.constant';

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
    icon,
}: {
    title: string;
    content: React.ReactNode;
    md?: boolean;
    ellipsis?: boolean;
    icon?: React.ReactNode;
}) => (
    <Paragraph
        ellipsis={ellipsis ? { rows: 5, expandable: false } : false}
        style={{ maxWidth: md ? '50vw' : '100vw', marginBottom: '0.8rem' }}
    >
        <Title
            type="secondary"
            level={5}
            style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '0' }}
        >
            {icon && <span style={{ marginRight: '8px' }}>{icon}</span>}
            {title}:
        </Title>
        {'  '}
        <div style={{ display: 'inline-block' }}>{content}</div>
    </Paragraph>
);

export type MovieProps = {
    slug: string;
    movie?: MovieType;
};

export function Movie({ slug, movie: movieProp }: MovieProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { md } = useBreakpoint();
    const [isFollowing, setIsFollowing] = useState(false);

    // Get the referrer search parameters if they exist
    const referrerSearch = searchParams?.get('from') || '';

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

    const createSearchUrl = (field: string, value: string) => {
        // Different entities have different field structures in the filter system
        let filterField = field;

        // Map the entity fields to their correct filter field names
        if (field === 'actor') filterField = 'keywords';
        if (field === 'director') filterField = 'keywords';
        if (field === 'category.slug') filterField = 'categories';
        if (field === 'country.slug') filterField = 'countries';

        const queryString = stringifyTableParams({
            filters: [
                {
                    field: filterField,
                    operator: 'eq',
                    value,
                },
            ],
            sorters: [],
        });

        return `${RouteNameEnum.MOVIE_LIST_PAGE}?${queryString}`;
    };

    const renderMovieInfoSection = () => {
        return (
            <Space
                size="small"
                direction="vertical"
                className="movieInfo"
                style={{ width: '100%' }}
            >
                <InfoItem
                    md={md}
                    title="Định dạng"
                    icon={<InfoCircleOutlined />}
                    content={
                        movie?.type ? (
                            <Link href={createSearchUrl('type', movie.type)}>
                                <Tag
                                    color="cyan"
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        padding: '0 8px',
                                    }}
                                >
                                    {movieTypeTranslations[movie.type as MovieTypeEnum] ||
                                        movie.type}
                                </Tag>
                            </Link>
                        ) : (
                            <Text strong>N/A</Text>
                        )
                    }
                />

                <InfoItem
                    md={md}
                    title="Thời lượng"
                    icon={<ClockCircleOutlined />}
                    content={<Text strong>{movie?.time || 'N/A'}</Text>}
                />

                <InfoItem
                    md={md}
                    title="Năm phát hành"
                    icon={<CalendarOutlined />}
                    content={
                        movie?.year ? (
                            <Link href={createSearchUrl('years', movie.year.toString())}>
                                <Tag
                                    color="magenta"
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        padding: '0 8px',
                                    }}
                                >
                                    {movie.year}
                                </Tag>
                            </Link>
                        ) : (
                            <Text strong>N/A</Text>
                        )
                    }
                />

                <InfoItem
                    md={md}
                    title="Đánh giá"
                    icon={<InfoCircleOutlined />}
                    content={
                        <Space size={12}>
                            {movie?.imdb?.id && (
                                <IMDBRating id={movie?.imdb?.id} size={md ? 'middle' : 'small'} />
                            )}
                            {movie?.tmdb?.id && (
                                <TMDBRating
                                    id={movie?.tmdb?.id}
                                    type={movie?.tmdb?.type}
                                    size={md ? 'middle' : 'small'}
                                />
                            )}
                            {!movie?.imdb?.id && !movie?.tmdb?.id && <Text>Chưa có đánh giá</Text>}
                        </Space>
                    }
                />

                <InfoItem
                    md={md}
                    title="Thể loại"
                    icon={<TagsOutlined />}
                    content={
                        <Space size={[4, 8]} wrap>
                            {movie?.categories?.map((category) => (
                                <Link
                                    key={category?.slug}
                                    href={createSearchUrl('category.slug', category?.slug || '')}
                                >
                                    <Tag
                                        color="green"
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            padding: '0 8px',
                                        }}
                                    >
                                        {category?.name}
                                    </Tag>
                                </Link>
                            ))}
                        </Space>
                    }
                />

                <InfoItem
                    md={md}
                    title="Quốc gia"
                    icon={<GlobalOutlined />}
                    content={
                        <Space size={[4, 8]} wrap>
                            {movie?.countries?.map((country) => (
                                <Link
                                    key={country?.slug}
                                    href={createSearchUrl('country.slug', country?.slug || '')}
                                >
                                    <Tag
                                        color="blue"
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: '12px',
                                            padding: '0 8px',
                                        }}
                                    >
                                        {country?.name}
                                    </Tag>
                                </Link>
                            ))}
                        </Space>
                    }
                />

                <InfoItem
                    md={md}
                    title="Trạng thái"
                    icon={<InfoCircleOutlined />}
                    content={
                        movie?.status ? (
                            <Link href={createSearchUrl('status', movie.status)}>
                                <Tag
                                    color="volcano"
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        padding: '0 8px',
                                    }}
                                >
                                    {movieStatusTranslations[movie.status as MovieStatusEnum] ||
                                        movie.status}
                                </Tag>
                            </Link>
                        ) : (
                            <Text strong>N/A</Text>
                        )
                    }
                />

                <InfoItem
                    md={md}
                    title="Chiếu rạp"
                    icon={<InfoCircleOutlined />}
                    content={
                        <Link
                            href={createSearchUrl(
                                'cinemaRelease',
                                movie?.cinemaRelease ? 'true' : 'false',
                            )}
                        >
                            <Tag
                                color={movie?.cinemaRelease ? 'gold' : 'default'}
                                style={{
                                    cursor: 'pointer',
                                    borderRadius: '12px',
                                    padding: '0 8px',
                                }}
                            >
                                {movie?.cinemaRelease ? 'Có' : 'Không'}
                            </Tag>
                        </Link>
                    }
                />

                {movie?.directors && movie?.directors?.length > 0 && (
                    <InfoItem
                        md={md}
                        title="Đạo diễn"
                        icon={<UserOutlined />}
                        content={
                            <Space size={[4, 8]} wrap>
                                {movie?.directors?.map((director) => (
                                    <React.Fragment key={`${director?._id?.toString()}`}>
                                        {director?.tmdbPersonId ? (
                                            <Space size={4}>
                                                <Link
                                                    href={createSearchUrl(
                                                        'director',
                                                        director?.name || '',
                                                    )}
                                                >
                                                    <Tag
                                                        color="purple"
                                                        style={{
                                                            cursor: 'pointer',
                                                            borderRadius: '12px',
                                                            padding: '0 8px',
                                                        }}
                                                    >
                                                        {director?.name}
                                                    </Tag>
                                                </Link>
                                                <Link
                                                    target="_blank"
                                                    href={`https://www.themoviedb.org/person/${director.tmdbPersonId}`}
                                                >
                                                    <Tooltip title="Xem trên TMDB">
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            style={{ padding: '0 4px' }}
                                                        >
                                                            <InfoCircleOutlined />
                                                        </Button>
                                                    </Tooltip>
                                                </Link>
                                            </Space>
                                        ) : (
                                            <Link
                                                href={createSearchUrl(
                                                    'director',
                                                    director?.name || '',
                                                )}
                                            >
                                                <Tag
                                                    color="purple"
                                                    style={{
                                                        cursor: 'pointer',
                                                        borderRadius: '12px',
                                                        padding: '0 8px',
                                                    }}
                                                >
                                                    {director?.name}
                                                </Tag>
                                            </Link>
                                        )}
                                    </React.Fragment>
                                ))}
                            </Space>
                        }
                    />
                )}
                <InfoItem
                    md={md}
                    title="Diễn viên"
                    icon={<TeamOutlined />}
                    content={
                        <Space size={[4, 8]} wrap>
                            {movie?.actors?.map((actor) => (
                                <React.Fragment key={`${actor?._id?.toString()}`}>
                                    {actor?.tmdbPersonId ? (
                                        <Space size={4}>
                                            <Link
                                                href={createSearchUrl('actor', actor?.name || '')}
                                            >
                                                <Tag
                                                    color="orange"
                                                    style={{
                                                        cursor: 'pointer',
                                                        borderRadius: '12px',
                                                        padding: '0 8px',
                                                    }}
                                                >
                                                    {actor?.name}
                                                </Tag>
                                            </Link>
                                            <Link
                                                target="_blank"
                                                href={`https://www.themoviedb.org/person/${actor.tmdbPersonId}`}
                                            >
                                                <Tooltip title="Xem trên TMDB">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        style={{ padding: '0 4px' }}
                                                    >
                                                        <InfoCircleOutlined />
                                                    </Button>
                                                </Tooltip>
                                            </Link>
                                        </Space>
                                    ) : (
                                        <Link href={createSearchUrl('actor', actor?.name || '')}>
                                            <Tag
                                                color="orange"
                                                style={{
                                                    cursor: 'pointer',
                                                    borderRadius: '12px',
                                                    padding: '0 8px',
                                                }}
                                            >
                                                {actor?.name}
                                            </Tag>
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </Space>
                    }
                />
                <Divider style={{ margin: '12px 0' }} />
                <InfoItem
                    md={md}
                    title="Tóm tắt"
                    content={movie?.content}
                    ellipsis={false}
                    icon={<InfoCircleOutlined />}
                />
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
                            title: referrerSearch ? (
                                <Tooltip title="Quay lại kết quả tìm kiếm">
                                    <Link href={`/danh-sach-phim?${referrerSearch}`}>
                                        <span
                                            style={{ display: 'inline-flex', alignItems: 'center' }}
                                        >
                                            <SearchOutlined
                                                style={{
                                                    marginRight: '0.5rem',
                                                    fontSize: '0.8rem',
                                                }}
                                            />
                                            Danh sách phim
                                        </span>
                                    </Link>
                                </Tooltip>
                            ) : (
                                <Link href="/danh-sach-phim">Danh sách phim</Link>
                            ),
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
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'rgba(0, 0, 0, 0.2)',
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: md ? '16px' : '8px',
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
                                            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
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
                                    <Title
                                        level={md ? 1 : 4}
                                        style={{ marginBottom: '0', color: '#fff' }}
                                    >
                                        {movie?.name}
                                    </Title>
                                    <Text
                                        type="secondary"
                                        style={{ fontSize: md ? '1rem' : '0.8rem' }}
                                    >
                                        {movie?.originName}
                                    </Text>
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
                                </div>
                                {md && renderMovieInfoSection()}
                                <Row
                                    gutter={[8, 8]}
                                    style={{ width: md ? '30%' : 'auto', marginTop: '12px' }}
                                >
                                    <Col span={18}>
                                        <Link
                                            href={`/phim/${movie?.slug}/${getFirstEpisodeSlug(
                                                movie,
                                            )}${referrerSearch ? `?from=${referrerSearch}` : ''}`}
                                        >
                                            <Button
                                                type="primary"
                                                size={md ? 'large' : 'middle'}
                                                icon={<PlayCircleOutlined />}
                                                style={{
                                                    width: '100%',
                                                    height: md ? '40px' : '36px',
                                                    borderRadius: '8px',
                                                    fontWeight: 'bold',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
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
                                                type={isFollowing ? 'default' : 'primary'}
                                                ghost={!isFollowing}
                                                size={md ? 'large' : 'middle'}
                                                style={{
                                                    width: '100%',
                                                    height: md ? '40px' : '36px',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
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
                    <Row style={{ marginTop: '1rem' }}>
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
