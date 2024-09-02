import React, { useState, useRef, useEffect } from 'react';
import { Card, Typography, Button, Grid, Space, Divider } from 'antd';
import { CalendarOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import './movie-list.css';

const { Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

import { HigherHeightImage } from '@/components/image/higher-image';
import { MovieQualityTag } from '@/components/tag/movie-quality';
import type { Movie } from 'apps/api/src/app/movies/movie.schema';

interface MovieCardProps {
    movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
    const { content, year, name, posterUrl, thumbUrl, episodeCurrent, originName, quality } = movie;
    const { md } = useBreakpoint();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{
                position: 'relative',
                width: '14rem',
                height: '21rem',
                transition: 'all 0.3s ease-in-out',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card
                hoverable
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '0.3rem',
                    position: 'relative',
                    transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.3s ease-in-out',
                }}
                styles={{
                    body: { padding: 0, height: '100%' },
                }}
            >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <HigherHeightImage
                        alt={name}
                        url1={thumbUrl}
                        url2={posterUrl}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '0.3rem',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            color: 'white',
                            padding: '2px 8px',
                            fontSize: 12,
                            fontWeight: 'bold',
                            background: 'rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {episodeCurrent}
                    </div>
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
                            opacity: isHovered ? 1 : 0,
                            pointerEvents: isHovered ? 'auto' : 'none',
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Text style={{ color: 'white', fontSize: md ? '1rem' : '0.8rem' }}>
                                {name}
                            </Text>
                            <Paragraph
                                type="secondary"
                                ellipsis={{ rows: 2, expandable: false }}
                                style={{ fontSize: '0.7rem', marginBottom: 0, color: '#a6a6a6' }}
                            >
                                {originName}
                            </Paragraph>
                            <div
                                style={{
                                    marginTop: '0.3rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <MovieQualityTag
                                    quality={quality ?? ''}
                                    style={{ marginRight: 4, fontSize: '0.6rem' }}
                                />
                                <Divider
                                    type="vertical"
                                    style={{ height: '0.8rem', background: '#a6a6a6' }}
                                />
                                <Text style={{ fontSize: '0.6rem', color: '#a6a6a6' }}>
                                    <CalendarOutlined /> {year}
                                </Text>
                                <Divider
                                    type="vertical"
                                    style={{ height: '0.8rem', background: '#a6a6a6' }}
                                />
                                <Text style={{ fontSize: '0.6rem', color: '#a6a6a6' }}>
                                    {episodeCurrent}
                                </Text>
                            </div>
                            <Paragraph
                                ellipsis={{ rows: 3, expandable: false }}
                                style={{
                                    color: '#a6a6a6',
                                    fontSize: '0.7rem',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                }}
                            >
                                {content}
                            </Paragraph>
                        </Space>
                        <Button
                            type="primary"
                            size="small"
                            icon={<PlayCircleOutlined />}
                            style={{ width: '100%' }}
                        >
                            Xem ngay
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default function MovieList() {
    const { data, isLoading } = useList<Movie>({ resource: 'movies' });
    const { md } = useBreakpoint();
    const swiperRef = useRef<SwiperType>();

    if (isLoading) return <div>Loading...</div>;

    return (
        <div
            className="movie-list-container"
            style={{ overflow: 'visible', padding: '0 40px', position: 'relative' }}
        >
            <Swiper
                slidesPerView={md ? 6 : 2}
                spaceBetween={12}
                modules={[Navigation]}
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                style={{ overflow: 'visible' }}
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                }}
            >
                {data?.data.map((movie) => (
                    <SwiperSlide
                        key={movie._id?.toString()}
                        style={{ overflow: 'visible' }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.zIndex = '100';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.zIndex = '1';
                        }}
                    >
                        <MovieCard movie={movie} />
                    </SwiperSlide>
                ))}
            </Swiper>
            <div className="swiper-button-prev" />
            <div className="swiper-button-next" />
        </div>
    );
}
