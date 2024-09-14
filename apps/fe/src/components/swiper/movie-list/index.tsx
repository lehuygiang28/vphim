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

const getSlidesPerView = (md = false, lg = false, xl = false, xxl = false) => {
    if (xxl) {
        return 6;
    } else if (xl) {
        return 5;
    } else if (lg) {
        return 4;
    } else if (md) {
        return 3;
    } else {
        return 2;
    }
};

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
    style,
}: MovieListProps) {
    const { md, lg, xl, xxl } = useBreakpoint();
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

    return (
        <div
            className="movie-list-container"
            style={{
                overflow: 'visible',
                position: 'relative',
                ...style,
            }}
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
                        Xem thêm <ArrowRightOutlined style={{ marginLeft: '4px' }} />
                    </Link>
                )}
            </div>
            <Swiper
                slidesPerView={getSlidesPerView(md, lg, xl, xxl)}
                spaceBetween={12}
                modules={[Navigation]}
                navigation={{
                    nextEl: `#${nextButtonId}`,
                    prevEl: `#${prevButtonId}`,
                }}
                style={{
                    overflow: 'visible',
                    padding: md ? '0 3rem' : undefined,
                }}
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
                        <MovieCard
                            movie={movie}
                            visibleContent={selectedIndex === index}
                            scale={md ? undefined : 1.1}
                        />
                    </SwiperSlide>
                ))}
            </Swiper>
            <div className="swiper-button-prev" id={prevButtonId} />
            <div className="swiper-button-next" id={nextButtonId} />
        </div>
    );
}
