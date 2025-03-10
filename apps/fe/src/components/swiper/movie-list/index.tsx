import 'swiper/css';
import 'swiper/css/navigation';
import './movie-list.css';

import React, { useRef, CSSProperties, useState, useEffect, useMemo, useCallback } from 'react';
import { Typography, Grid, Skeleton } from 'antd';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ArrowRightOutlined } from '@ant-design/icons';

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';

import { MovieCard } from '@/components/card/movie-card';
import { randomString } from '@/libs/utils/common';

const { Title } = Typography;
const { useBreakpoint } = Grid;
const { Image: SkeletonImage } = Skeleton;

const getSlidesPerView = (md = false, lg = false, xl = false, xxl = false) => {
    if (xxl) return 6;
    if (xl) return 5;
    if (lg) return 4;
    if (md) return 3;
    return 2;
};

export type MovieListProps = {
    title?: string;
    movies?: MovieResponseDto[];
    isLoading?: boolean;
    style?: CSSProperties;
    viewMoreHref?: string;
    clearVisibleContentCard?: boolean;
    disableNavigation?: boolean;
    eagerLoad?: number;
};

export default function MovieList({
    title,
    movies = [],
    isLoading = false,
    viewMoreHref,
    clearVisibleContentCard,
    style,
    disableNavigation = false,
    eagerLoad = 0,
}: MovieListProps) {
    const { md, lg, xl, xxl } = useBreakpoint();
    const swiperRef = useRef<SwiperType>();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const isMobile = !md;
    const navContainerRef = useRef<HTMLDivElement>(null);

    const uniqueId = useMemo(() => randomString(10), []);
    const prevButtonId = `prev-button-${uniqueId}`;
    const nextButtonId = `next-button-${uniqueId}`;

    const handleMouseEnter = useCallback(() => setShowMobileNav(true), []);
    const handleMouseLeave = useCallback(() => setShowMobileNav(false), []);

    useEffect(() => {
        if (clearVisibleContentCard) {
            setSelectedIndex(null);
        }
    }, [clearVisibleContentCard]);

    useEffect(() => {
        if (swiperRef.current && !disableNavigation) {
            swiperRef.current.navigation.init();
            swiperRef.current.navigation.update();
        }
    }, [swiperRef.current, disableNavigation]);

    const handleVisibleContentCard = useCallback(
        (index: number | null) => {
            if (index === null || index === selectedIndex) {
                setSelectedIndex(null);
            } else {
                setSelectedIndex(index);
            }
        },
        [selectedIndex],
    );

    const breakpoints = useMemo(
        () => ({
            320: {
                slidesPerView: 2.2,
                spaceBetween: 12,
            },
            480: {
                slidesPerView: 3.2,
                spaceBetween: 12,
            },
            640: {
                slidesPerView: 4.2,
                spaceBetween: 12,
            },
            768: {
                slidesPerView: 4.2,
                spaceBetween: 16,
            },
            1024: {
                slidesPerView: 5.2,
                spaceBetween: 16,
            },
            1280: {
                slidesPerView: 6.2,
                spaceBetween: 20,
            },
        }),
        [],
    );

    const freeModeConfig = useMemo(
        () => ({
            enabled: isMobile,
            sticky: true,
            momentumRatio: 0.25,
        }),
        [isMobile],
    );

    const renderSkeleton = useCallback(() => {
        const slideCount = isMobile ? 3 : lg ? 5 : xl ? 6 : 4;

        return Array(slideCount)
            .fill(null)
            .map((_, index) => (
                <SwiperSlide
                    key={`skeleton-${index}`}
                    style={{
                        overflow: 'visible',
                        height: 'auto',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            aspectRatio: '2/3',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                        }}
                    >
                        <SkeletonImage
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '0.5rem',
                            }}
                            active={true}
                        />
                    </div>
                </SwiperSlide>
            ));
    }, [isMobile, lg, xl]);

    const navigationConfig = useMemo(
        () => ({
            prevEl: `#${prevButtonId}`,
            nextEl: `#${nextButtonId}`,
            enabled: !disableNavigation,
            disabledClass: 'swiper-button-disabled',
            hiddenClass: 'swiper-button-hidden',
        }),
        [prevButtonId, nextButtonId, disableNavigation],
    );

    const renderMobileSwipeIndicator = useCallback(() => {
        if (!isMobile) return null;

        return (
            <div className="mobile-swipe-indicator">
                <div className="indicator-dot"></div>
                <div className="indicator-dot"></div>
                <div className="indicator-dot"></div>
            </div>
        );
    }, [isMobile]);

    return (
        <div
            className="movie-list-container"
            style={style}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={navContainerRef}
        >
            {title && (
                <div className="list-header">
                    <h3 className="list-title">{title}</h3>
                    {viewMoreHref && (
                        <Link href={viewMoreHref} className="view-more">
                            <span>Xem thêm</span>
                            <ArrowRightOutlined />
                        </Link>
                    )}
                </div>
            )}

            <Swiper
                className="movie-swiper"
                modules={[Navigation, FreeMode]}
                slidesPerView={'auto'}
                spaceBetween={md ? 16 : 12}
                freeMode={freeModeConfig}
                touchRatio={1.5}
                watchSlidesProgress={true}
                onBeforeInit={(swiper) => {
                    swiperRef.current = swiper;
                }}
                breakpoints={breakpoints}
                navigation={navigationConfig}
                speed={400}
                grabCursor={true}
                observer={true}
                observeParents={true}
                resizeObserver={true}
            >
                {isLoading && renderSkeleton()}
                {!isLoading &&
                    movies?.length > 0 &&
                    movies.map((movie, index) => (
                        <SwiperSlide
                            key={movie._id.toString()}
                            onClick={() => handleVisibleContentCard(index)}
                            style={{ height: 'auto' }}
                        >
                            <div className="movie-card">
                                <MovieCard
                                    movie={movie}
                                    loadType={index < eagerLoad ? 'eager' : undefined}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
            </Swiper>

            {renderMobileSwipeIndicator()}

            <button
                id={prevButtonId}
                className="swiper-button-prev"
                aria-label="Previous slide"
            ></button>
            <button
                id={nextButtonId}
                className="swiper-button-next"
                aria-label="Next slide"
            ></button>
        </div>
    );
}
