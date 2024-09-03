import React, { useRef, CSSProperties, ReactNode } from 'react';
import { Typography, Grid } from 'antd';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ArrowRightOutlined } from '@ant-design/icons';

import 'swiper/css';
import 'swiper/css/navigation';
import './movie-list.css';

const { Title, Link: AntdLink } = Typography;
const { useBreakpoint } = Grid;

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import { MovieCard } from '@/components/card/movie-card';
import { randomString } from '@/libs/utils/common';
import Link from 'next/link';

export type MovieListProps = {
    title?: string;
    movies?: MovieResponseDto[];
    isLoading?: boolean;
    style?: CSSProperties;
    viewMoreHref?: string;
};

export default function MovieList({
    title,
    movies,
    isLoading,
    style,
    viewMoreHref,
}: MovieListProps) {
    const { md } = useBreakpoint();
    const swiperRef = useRef<SwiperType>();

    const prevButtonId = randomString(12, { onlyLetters: true });
    const nextButtonId = randomString(12, { onlyLetters: true });

    const TopRightList = ({ href }: { href: string }) => {
        return (
            <Link href={href}>
                <AntdLink>
                    Xem thêm <ArrowRightOutlined />
                </AntdLink>
            </Link>
        );
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div
            className="movie-list-container"
            style={{ overflow: 'visible', padding: '0 40px', position: 'relative', ...style }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                }}
            >
                {title && (
                    <Link href={viewMoreHref ?? '#'}>
                        <Title level={md ? 3 : 4} style={{ fontWeight: 'bold' }}>
                            {title}
                        </Title>
                    </Link>
                )}
                <div>
                    {viewMoreHref && <TopRightList href={viewMoreHref ?? '#'}></TopRightList>}
                </div>
            </div>
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
