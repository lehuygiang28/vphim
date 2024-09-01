import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { Typography, Image, Row, Col, Space, Grid } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectFade, Pagination } from 'swiper/modules';

import './movie.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

import type { Movie } from 'apps/api/src/app/movies/movie.schema';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

interface MovieSwiperProps {
    movies?: Movie[];
}

export const MovieSwiper: React.FC<MovieSwiperProps> = ({ movies }) => {
    const { md } = useBreakpoint();
    const [currentBg, setCurrentBg] = useState(movies?.[0].thumbUrl);

    const heroStyle: CSSProperties = {
        position: 'relative',
        height: '85vh',
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
        height: '90vh',
        zIndex: 0,
        transition: 'background-image 0.5s ease', // Add transition for background image
    };

    const contentStyle: CSSProperties = {
        padding: '2rem',
        textAlign: 'left',
        zIndex: 1,
        height: '100%',
    };

    const posterStyle: CSSProperties = {
        borderRadius: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        width: '100%',
        height: '100%',
        transition: 'transform 0.5s ease', // Add transition for smooth slide
        transform: 'translateX(75%)', // Initially position the image off-screen
    };

    const textContentStyle: CSSProperties = {
        padding: '1rem',
        borderRadius: '8px',
        color: '#fff',
        textAlign: 'left',
    };

    return (
        <>
            <div
                style={{
                    ...bgImageStyle,
                    backgroundImage: `url(${currentBg})`,
                }}
            />
            <Swiper
                modules={[EffectFade, Pagination]}
                effect="fade"
                slidesPerView={1}
                fadeEffect={{
                    crossFade: true,
                }}
                pagination={{
                    clickable: true,
                    enabled: true,
                }}
                onSlideChange={(swiper) => {
                    const activeIndex = swiper.activeIndex;
                    const slides = swiper.slides;

                    setCurrentBg(movies?.[activeIndex].thumbUrl);

                    // Slide in the active slide's image from right to left
                    (
                        slides[activeIndex].querySelector('.posterImage') as HTMLElement
                    ).style.transform = 'translateX(0)';

                    // Move the previous slide's image off-screen to the left
                    if (activeIndex > 0) {
                        (
                            slides[activeIndex - 1].querySelector('.posterImage') as HTMLElement
                        ).style.transform = 'translateX(75%)';
                    }

                    // Move the next slide's image off-screen to the right
                    if (activeIndex < slides.length - 1) {
                        (
                            slides[activeIndex + 1].querySelector('.posterImage') as HTMLElement
                        ).style.transform = 'translateX(75%)';
                    }
                }}
                onInit={(swiper) => {
                    // Initially slide in the first slide's image
                    (
                        swiper.slides[0].querySelector('.posterImage') as HTMLElement
                    ).style.transform = 'translateX(0)';
                }}
            >
                {movies?.map((movie) => (
                    <SwiperSlide key={movie.name}>
                        <div style={heroStyle}>
                            <div style={contentStyle}>
                                <Row
                                    justify="center"
                                    align="middle"
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <Col xs={{ span: 12 }} md={{ span: 16 }}>
                                        <div style={textContentStyle} className="textContent">
                                            <Space direction="vertical">
                                                <div>
                                                    <Title level={1} style={{ marginBottom: '0' }}>
                                                        {movie.name}
                                                    </Title>
                                                    <Text style={{ color: 'rgb(156, 163, 175)' }}>
                                                        {movie.originName}
                                                    </Text>
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <Space size={'middle'}>
                                                            <span>
                                                                <CalendarOutlined
                                                                    style={{ fontSize: '0.8rem' }}
                                                                />
                                                                <Text
                                                                    style={{ fontSize: '0.8rem' }}
                                                                >
                                                                    {' '}
                                                                    {movie.year}
                                                                </Text>
                                                            </span>
                                                            <Text style={{ fontSize: '0.8rem' }}>
                                                                |
                                                            </Text>
                                                            <Text style={{ fontSize: '0.8rem' }}>
                                                                {movie.episodeCurrent}
                                                            </Text>
                                                        </Space>
                                                    </div>
                                                </div>
                                                {md && (
                                                    <Paragraph
                                                        ellipsis={{
                                                            rows: 3,
                                                            expandable: false,
                                                            symbol: 'Xem th\u00eam',
                                                        }}
                                                        style={{ maxWidth: '45vw' }}
                                                    >
                                                        {movie.content}
                                                    </Paragraph>
                                                )}
                                            </Space>
                                        </div>
                                    </Col>
                                    <Col xs={{ span: 12 }} md={{ span: 8 }}>
                                        <Image
                                            src={movie.posterUrl}
                                            alt={movie.name}
                                            width={300}
                                            style={posterStyle}
                                            className="posterImage"
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    );
};
