import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Typography, Row, Col, Space, Grid, Tag } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import { EffectFade, Pagination, Autoplay } from 'swiper/modules';

import './movie.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import { HigherHeightImage } from '@/components/image/higher-image';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface MovieSwiperProps {
    movies?: MovieResponseDto[];
}

export const MovieSwiper: React.FC<MovieSwiperProps> = ({ movies }) => {
    const { md } = useBreakpoint();
    const [currentBg, setCurrentBg] = useState<string | null>(null);

    useEffect(() => {
        if (movies?.[0]) {
            setCurrentBg(movies?.[0]?.posterUrl);
        }
    }, [movies]);

    const heroStyle: CSSProperties = {
        position: 'relative',
        height: md ? '80vh' : '50vh',
        overflow: 'hidden',
    };

    const bgImageStyle: CSSProperties = {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(1rem) brightness(0.8)',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: md ? '85vh' : '55vh',
        zIndex: 0,
        transition: 'background-image 0.5s ease',
    };

    const contentStyle: CSSProperties = {
        padding: '2rem',
        textAlign: 'left',
        zIndex: 1,
        height: '100%',
    };

    const posterStyle: CSSProperties = {
        borderRadius: '0.5rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        transition: 'transform 0.5s ease',
        width: '100%',
        height: '100%',
        maxWidth: '25rem',
        maxHeight: '27rem',
        objectFit: 'cover',
    };

    const textContentStyle: CSSProperties = {
        padding: '0',
        color: '#fff',
        textAlign: 'left',
    };

    return (
        <>
            <div style={{ display: 'none' }}>
                {movies?.map((movie) => {
                    return (
                        <div key={`${movie?._id.toString()}_preload_img`}>
                            {movie?.thumbUrl && (
                                <img
                                    src={movie?.thumbUrl}
                                    alt={movie?.name}
                                    style={{
                                        display: 'none',
                                    }}
                                />
                            )}
                            {movie?.posterUrl && (
                                <img
                                    src={movie?.posterUrl}
                                    alt={movie?.name}
                                    style={{
                                        display: 'none',
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            {currentBg && (
                <div
                    style={{
                        ...bgImageStyle,
                        backgroundImage: `url(${currentBg})`,
                    }}
                />
            )}

            <Swiper
                modules={[EffectFade, Pagination, Autoplay]}
                effect="fade"
                slidesPerView={1}
                fadeEffect={{
                    crossFade: true,
                }}
                pagination={{
                    clickable: true,
                    enabled: true,
                }}
                autoplay={{
                    delay: 3000,
                }}
                onSlideChange={(swiper) => {
                    const activeIndex = swiper.activeIndex;
                    const slides = swiper.slides;

                    setCurrentBg(movies?.[activeIndex]?.posterUrl ?? null);

                    // Slide in the active slide's image from right to left
                    const slide = slides[activeIndex].querySelector('.posterImage') as HTMLElement;
                    if (slide) {
                        slide.style.transform = 'translateX(0)';
                    }
                }}
                onBeforeTransitionStart={(swiper: SwiperClass) => {
                    const activeIndex = swiper.activeIndex;
                    const slides = swiper.slides;
                    // Move the previous slide's image off-screen to the left
                    if (activeIndex > 0) {
                        const slide = slides[activeIndex - 1].querySelector(
                            '.posterImage',
                        ) as HTMLElement;
                        if (slide) {
                            slide.style.transform = 'translateX(75%)';
                        }
                    }

                    // Move the next slide's image off-screen to the right
                    if (activeIndex < slides.length - 1) {
                        const slide = slides[activeIndex + 1].querySelector(
                            '.posterImage',
                        ) as HTMLElement;
                        if (slide) {
                            slide.style.transform = 'translateX(75%)';
                        }
                    }
                }}
            >
                {movies?.map((movie) => (
                    <SwiperSlide key={movie.slug}>
                        <Link href={`/phim/${movie.slug}`}>
                            <div style={heroStyle}>
                                <div style={contentStyle}>
                                    <Row
                                        justify="center"
                                        align="middle"
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <Col xs={{ span: 14 }} md={{ span: 18 }}>
                                            <div style={textContentStyle} className="textContent">
                                                <Space
                                                    direction="vertical"
                                                    size={md ? 'middle' : 'small'}
                                                >
                                                    <div>
                                                        <Title
                                                            level={md ? 1 : 4}
                                                            style={{ marginBottom: '0' }}
                                                        >
                                                            {movie.name}
                                                        </Title>
                                                        <Text type="secondary">
                                                            {movie.originName}
                                                        </Text>
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <Space size={md ? 'middle' : 'small'}>
                                                                <span>
                                                                    <CalendarOutlined
                                                                        style={{
                                                                            fontSize: '0.8rem',
                                                                        }}
                                                                    />
                                                                    <Text
                                                                        style={{
                                                                            fontSize: '0.8rem',
                                                                        }}
                                                                    >
                                                                        {' '}
                                                                        {movie.year}
                                                                    </Text>
                                                                </span>
                                                                <Text
                                                                    style={{ fontSize: '0.8rem' }}
                                                                >
                                                                    |
                                                                </Text>
                                                                <Text
                                                                    style={{ fontSize: '0.8rem' }}
                                                                >
                                                                    {movie.episodeCurrent}
                                                                </Text>
                                                            </Space>
                                                        </div>
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            {movie?.categories?.map((category) => (
                                                                <Tag
                                                                    key={category?._id?.toString()}
                                                                    style={{
                                                                        fontSize: md
                                                                            ? '0.7rem'
                                                                            : '0.5rem',
                                                                        background:
                                                                            'rgba(0 0 0 / 0.4)',
                                                                        border: 'none',
                                                                    }}
                                                                >
                                                                    {category?.name}
                                                                </Tag>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {md && (
                                                        <Paragraph
                                                            ellipsis={{
                                                                rows: md ? 5 : 3,
                                                                expandable: false,
                                                            }}
                                                            style={{ maxWidth: '45vw' }}
                                                        >
                                                            {movie.content}
                                                        </Paragraph>
                                                    )}
                                                </Space>
                                            </div>
                                            {md ? (
                                                <div
                                                    style={{
                                                        background: '#bd1010',
                                                        borderRadius: '9999px',
                                                        maxWidth: '4rem',
                                                        maxHeight: '4rem',
                                                    }}
                                                >
                                                    <Image
                                                        alt="play button"
                                                        src="/assets/play.svg"
                                                        width={64}
                                                        height={64}
                                                    />
                                                </div>
                                            ) : (
                                                <></>
                                            )}
                                        </Col>
                                        <Col xs={{ span: 10 }} md={{ span: 6 }}>
                                            <HigherHeightImage
                                                url1={movie?.thumbUrl}
                                                url2={movie?.posterUrl}
                                                alt={movie?.name}
                                                width={md ? 300 : 150}
                                                height={md ? 450 : 200}
                                                style={posterStyle}
                                                className="posterImage"
                                            />
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </Link>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    );
};
