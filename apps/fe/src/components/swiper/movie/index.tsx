'use client';

import './movie.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

import React, { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Typography, Row, Col, Space, Grid, Tag, Button } from 'antd';
import { CalendarOutlined, EyeOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Autoplay, Navigation } from 'swiper/modules';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';

import { ImageOptimized } from '@/components/image/image-optimized';
import { MovieQualityTag } from '@/components/tag/movie-quality';
import { TMDBRating } from '@/components/card/tmdb-rating';
import { IMDBRating } from '@/components/card/imdb-rating';
import { MovieContentRating } from '@/components/tag/movie-content-rating';
import { createSearchUrl } from '@/libs/utils/url.util';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface MovieSwiperProps {
    movies?: MovieType[];
}

export const MovieSwiper: React.FC<MovieSwiperProps> = ({ movies }) => {
    const { md } = useBreakpoint();
    const [currentMovieIndex, setCurrentMovieIndex] = useState<number | null>(null);
    const isMobile = !md;

    useEffect(() => {
        if (movies?.[0]) {
            setCurrentMovieIndex(0);
        }
    }, [movies]);

    const heroStyle: CSSProperties = {
        position: 'relative',
        height: md ? '85vh' : '90vh',
        overflow: 'hidden',
    };

    const bgImageStyle: CSSProperties = {
        filter: 'blur(0.7rem) brightness(0.3)',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        transition: 'all 0.8s ease-in-out',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const contentStyle: CSSProperties = {
        padding: md ? '4rem' : '1.5rem',
        textAlign: 'left',
        zIndex: 1,
        height: '100%',
        position: 'relative',
    };

    const posterStyle: CSSProperties = {
        borderRadius: '0.8rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
        transition: 'all 0.5s ease',
        width: '100%',
        height: '100%',
        maxWidth: md ? '22rem' : '100%',
        maxHeight: md ? '33rem' : '100%',
        objectFit: 'cover',
        display: 'block',
        margin: 'auto',
        background: 'transparent',
    };

    const textContentStyle: CSSProperties = {
        padding: md ? '0 2rem' : '0 0.5rem',
        color: '#fff',
        textAlign: 'left',
        position: 'relative',
        zIndex: 2,
    };

    const gradientOverlay: CSSProperties = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%',
        background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0) 100%)',
        zIndex: 1,
    };

    const clickableWrapperStyle: CSSProperties = {
        cursor: 'pointer',
        display: 'block',
        height: '100%',
        width: '100%',
    };

    const getRatings = (movie: MovieType) => (
        <div className="movie-ratings">
            {movie.tmdb?.id && (
                <TMDBRating
                    id={movie.tmdb.id}
                    type={movie.tmdb.type || 'movie'}
                    size={md ? 'middle' : 'small'}
                />
            )}
            {movie.imdb?.id && <IMDBRating id={movie.imdb.id} size={md ? 'middle' : 'small'} />}
        </div>
    );

    function renderTags(movie: MovieType) {
        return (
            <Space wrap size={[8, 8]}>
                <MovieQualityTag quality={movie?.quality || 'N/A'} />

                <MovieContentRating rating={movie?.contentRating || 'N/A'} />

                {movie?.year && (
                    <Link href={createSearchUrl('years', movie.year.toString())}>
                        <Tag
                            icon={<CalendarOutlined />}
                            color="magenta"
                            style={{
                                cursor: 'pointer',
                                borderRadius: '12px',
                                padding: '2px 8px',
                                fontWeight: 'bold',
                            }}
                        >
                            {movie.year}
                        </Tag>
                    </Link>
                )}

                {movie?.view !== undefined && (
                    <Tag
                        icon={<EyeOutlined />}
                        color="processing"
                        style={{
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontWeight: 'bold',
                        }}
                    >
                        {movie.view.toLocaleString() || '0'}
                    </Tag>
                )}
            </Space>
        );
    }

    return (
        <>
            {/* Background Images */}
            {movies?.length &&
                movies?.map((movie, index) => {
                    return (
                        <div
                            key={movie?._id.toString()}
                            style={{
                                ...bgImageStyle,
                                opacity: index === currentMovieIndex ? 1 : 0,
                            }}
                        >
                            <ImageOptimized
                                url={movie?.posterUrl}
                                alt={movie?.name}
                                width={1920}
                                height={1080}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                                quality={70}
                                loadType={index === 0 ? 'eager' : undefined}
                            />
                        </div>
                    );
                })}

            <div style={gradientOverlay}></div>

            <Swiper
                modules={[EffectFade, Autoplay, Navigation]}
                effect="fade"
                slidesPerView={1}
                fadeEffect={{
                    crossFade: true,
                }}
                navigation={{
                    enabled: true,
                }}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                onSlideChange={(swiper) => {
                    const activeIndex = swiper.activeIndex;
                    setCurrentMovieIndex(activeIndex);
                }}
                className="hero-swiper"
            >
                {movies?.map((movie, movieIndex) => (
                    <SwiperSlide key={movie.slug}>
                        <div style={heroStyle}>
                            <div style={contentStyle}>
                                {isMobile ? (
                                    // Mobile Layout - Entire slide is clickable
                                    <Link
                                        href={`/phim/${movie.slug}`}
                                        style={clickableWrapperStyle}
                                    >
                                        <div className="mobile-hero-content">
                                            <div className="mobile-poster-wrapper">
                                                <ImageOptimized
                                                    url={movie?.posterUrl}
                                                    alt={movie?.name}
                                                    width={300}
                                                    height={450}
                                                    style={{
                                                        borderRadius: '0.8rem',
                                                        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
                                                    }}
                                                    className="posterImage"
                                                    disableSkeleton
                                                    loadType={
                                                        movieIndex === 0 ? 'eager' : undefined
                                                    }
                                                />

                                                {movie.quality && (
                                                    <div className="quality-badge">
                                                        <MovieQualityTag quality={movie.quality} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mobile-movie-info">
                                                <Title
                                                    level={3}
                                                    className="movie-title"
                                                    style={{ marginTop: '1rem' }}
                                                >
                                                    {movie.name}
                                                </Title>

                                                {getRatings(movie)}

                                                {renderTags(movie)}

                                                <div className="categories-wrapper">
                                                    {movie?.categories?.length !== undefined &&
                                                        movie?.categories?.length > 0 &&
                                                        movie.categories
                                                            .slice(0, 2)
                                                            .map((category) => (
                                                                <Tag
                                                                    key={category._id.toString()}
                                                                    className="category-tag"
                                                                >
                                                                    {category.name}
                                                                </Tag>
                                                            ))}
                                                </div>

                                                <div className="button-group">
                                                    <Button
                                                        type="primary"
                                                        size="large"
                                                        icon={<PlayCircleOutlined />}
                                                        className="watch-button"
                                                        block
                                                    >
                                                        Xem Phim
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    // Desktop Layout
                                    <Row
                                        justify="center"
                                        align="middle"
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <Col xs={{ span: 24 }} md={{ span: 14 }} lg={{ span: 12 }}>
                                            <div
                                                style={textContentStyle}
                                                className="hero-text-content"
                                            >
                                                <Space
                                                    direction="vertical"
                                                    size={md ? 'large' : 'middle'}
                                                    style={{ width: '100%' }}
                                                >
                                                    <div className="movie-title-container">
                                                        <Title
                                                            level={md ? 1 : 3}
                                                            style={{
                                                                marginBottom: '0.5rem',
                                                                fontWeight: 800,
                                                                textShadow:
                                                                    '0 2px 10px rgba(0,0,0,0.7)',
                                                            }}
                                                            className="movie-title"
                                                        >
                                                            {movie.name}
                                                        </Title>

                                                        <Text
                                                            type="secondary"
                                                            style={{
                                                                fontSize: md ? '1.2rem' : '0.9rem',
                                                                opacity: 0.8,
                                                                display: 'block',
                                                                marginBottom: '1rem',
                                                            }}
                                                        >
                                                            {movie.originName}
                                                        </Text>
                                                    </div>

                                                    {renderTags(movie)}

                                                    <Paragraph
                                                        ellipsis={{ rows: md ? 3 : 2 }}
                                                        style={{
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            fontSize: md ? '1rem' : '0.85rem',
                                                            maxWidth: '90%',
                                                            marginBottom: '1.5rem',
                                                            lineHeight: 1.6,
                                                        }}
                                                    >
                                                        {movie.content}
                                                    </Paragraph>

                                                    <Space size="middle" align="center">
                                                        {getRatings(movie)}
                                                    </Space>

                                                    <Space size="middle">
                                                        <Link href={`/phim/${movie.slug}`}>
                                                            <Button
                                                                type="primary"
                                                                size={md ? 'large' : 'middle'}
                                                                icon={<PlayCircleOutlined />}
                                                                className="watch-button"
                                                            >
                                                                Xem Phim
                                                            </Button>
                                                        </Link>
                                                    </Space>
                                                </Space>
                                            </div>
                                        </Col>
                                        <Col xs={{ span: 0 }} md={{ span: 10 }} lg={{ span: 12 }}>
                                            <div className="poster-container">
                                                <Link href={`/phim/${movie.slug}`}>
                                                    <div className="poster-wrapper">
                                                        <ImageOptimized
                                                            url={movie?.posterUrl}
                                                            alt={movie?.name}
                                                            width={480}
                                                            height={854}
                                                            style={posterStyle}
                                                            className="posterImage"
                                                            disableSkeleton
                                                            loadType={
                                                                movieIndex === 0
                                                                    ? 'eager'
                                                                    : undefined
                                                            }
                                                        />
                                                    </div>
                                                </Link>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    );
};
