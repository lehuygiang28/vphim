import React, { useRef, CSSProperties, useState, useEffect } from 'react';
import { Typography, Grid } from 'antd';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ArrowRightOutlined } from '@ant-design/icons';

import 'swiper/css';
import 'swiper/css/navigation';
import './movie-list.css';

const { Title } = Typography;
const { useBreakpoint } = Grid;

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import { MovieCard } from '@/components/card/movie-card';
import { randomString } from '@/libs/utils/common';

export type MovieListProps = {
    title?: string;
    movies?: MovieResponseDto[];
    isLoading?: boolean;
    style?: CSSProperties;
    viewMoreHref?: string;
    clearVisibleContentCard?: boolean;
};

export default function MovieList({
    title,
    movies = [],
    isLoading,
    viewMoreHref,
    clearVisibleContentCard,
}: MovieListProps) {
    const { md } = useBreakpoint();
    const swiperRef = useRef<SwiperType>();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const prevButtonId = `prev-button-${randomString(10)}`;
    const nextButtonId = `next-button-${randomString(10)}`;

    useEffect(() => {
        if (clearVisibleContentCard) {
            setSelectedIndex(null);
        }
    }, [clearVisibleContentCard]);

    const handleVisibleContentCard = (index: number | null) => {
        if (index === null || index === selectedIndex) {
            setSelectedIndex(null);
        } else {
            setSelectedIndex(index);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div
            className="movie-list-container"
            style={{ overflow: 'visible', padding: md ? '0 3rem' : '0 1.5rem', position: 'relative' }}
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
                {viewMoreHref && (
                    <Link href={viewMoreHref} style={{ display: 'flex', alignItems: 'center' }}>
                        View More <ArrowRightOutlined style={{ marginLeft: '4px' }} />
                    </Link>
                )}
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
                {movies?.map((movie, index) => (
                    <SwiperSlide
                        key={movie._id.toString()}
                        style={{
                            overflow: 'visible',
                            width: md ? '13rem' : '8rem',
                            height: md ? '20rem' : '15rem',
                            zIndex: index === selectedIndex ? '100' : '1',
                        }}
                        onClick={() => handleVisibleContentCard(index)}
                        onMouseEnter={() => handleVisibleContentCard(index)}
                        onMouseLeave={() => handleVisibleContentCard(null)}
                    >
                        <MovieCard movie={movie} visibleContent={selectedIndex === index} />
                    </SwiperSlide>
                ))}
            </Swiper>
            <div className="swiper-button-prev" id={prevButtonId} />
            <div className="swiper-button-next" id={nextButtonId} />
        </div>
    );
}
