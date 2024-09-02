import React, { useRef, CSSProperties } from 'react';
import { Typography, Grid } from 'antd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/navigation';
import './movie-list.css';

const { Title } = Typography;
const { useBreakpoint } = Grid;

import type { Movie } from 'apps/api/src/app/movies/movie.schema';
import { MovieCard } from '@/components/card/movie-card';
import { randomString } from '@/libs/utils/common';

export type MovieListProps = {
    title?: string;
    movies?: Movie[];
    isLoading?: boolean;
    style?: CSSProperties;
};

export default function MovieList({ title, movies, isLoading, style }: MovieListProps) {
    const { md } = useBreakpoint();
    const swiperRef = useRef<SwiperType>();

    const prevButtonId = randomString(12, { onlyLetters: true });
    const nextButtonId = randomString(12, { onlyLetters: true });

    if (isLoading) return <div>Loading...</div>;

    return (
        <div
            className="movie-list-container"
            style={{ overflow: 'visible', padding: '0 40px', position: 'relative', ...style }}
        >
            {title && (
                <Title level={md ? 3 : 4} style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    {title}
                </Title>
            )}
            <Swiper
                slidesPerView={md ? 6 : 2}
                spaceBetween={12}
                modules={[Navigation]}
                navigation={{
                    nextEl: `#${nextButtonId}`,
                    prevEl: `#${prevButtonId}`,
                }}
                style={{ overflow: 'visible' }}
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                }}
            >
                {movies?.map((movie) => (
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
            <div className={'swiper-button-prev'} id={prevButtonId} />
            <div className={'swiper-button-next'} id={nextButtonId} />
        </div>
    );
}
