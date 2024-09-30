import React, { useRef, CSSProperties, useState, useEffect } from 'react';
import { Typography, Grid, Skeleton } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ArrowRightOutlined } from '@ant-design/icons';

import 'swiper/css';
import 'swiper/css/navigation';
import './movie-list.css';

const { Title } = Typography;
const { useBreakpoint } = Grid;
const { Image: SkeletonImage } = Skeleton;

import type { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import { MovieCard } from '@/components/card/movie-card';
import { randomString } from '@/libs/utils/common';

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
};

export default function MovieList({
    title,
    movies = [],
    isLoading = false,
    viewMoreHref,
    clearVisibleContentCard,
    style,
    disableNavigation = true,
}: MovieListProps) {
    const router = useRouter();
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

    const renderSkeleton = () => {
        const skeletonCount = getSlidesPerView(md, lg, xl, xxl);
        return Array(skeletonCount)
            .fill(null)
            .map((_, index) => (
                <SwiperSlide
                    key={`skeleton-${index}`}
                    style={{
                        overflow: 'visible',
                        width: md ? '13rem' : '8rem',
                        height: md ? '20rem' : '15rem',
                    }}
                >
                    <SkeletonImage
                        style={{
                            width: md ? '13rem' : '8rem',
                            height: md ? '20rem' : '15rem',
                        }}
                        active={true}
                    />
                </SwiperSlide>
            ));
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
                            {isLoading ? (
                                <Skeleton.Input style={{ width: '5rem' }} active />
                            ) : (
                                title
                            )}
                        </Title>
                    </Link>
                )}
                {viewMoreHref && !isLoading && (
                    <Link href={viewMoreHref} style={{ display: 'flex', alignItems: 'center' }}>
                        Xem thêm <ArrowRightOutlined style={{ marginLeft: '0.5rem' }} />
                    </Link>
                )}
            </div>
            <Swiper
                slidesPerView={getSlidesPerView(md, lg, xl, xxl)}
                spaceBetween={12}
                modules={[...(disableNavigation ? [] : [Navigation])]}
                navigation={
                    disableNavigation
                        ? false
                        : {
                              nextEl: `#${nextButtonId}`,
                              prevEl: `#${prevButtonId}`,
                          }
                }
                style={{
                    overflow: 'visible',
                    padding: disableNavigation ? undefined : md ? '0 2rem' : '0 0.5rem',
                }}
                onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                }}
            >
                {isLoading
                    ? renderSkeleton()
                    : movies?.map((movie, index) => (
                          <SwiperSlide
                              key={movie._id.toString()}
                              style={{
                                  overflow: 'visible',
                                  width: md ? '13rem' : '8rem',
                                  height: md ? '20rem' : '15rem',
                                  zIndex: index === selectedIndex ? '100' : '1',
                              }}
                              onClick={() => {
                                  if (md) {
                                      router.push(`/phim/${movie.slug}`);
                                  } else {
                                      handleVisibleContentCard(index);
                                  }
                              }}
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
            {!isLoading && movies?.length > 0 && !disableNavigation && (
                <>
                    <div className="swiper-button-prev" id={prevButtonId} />
                    <div className="swiper-button-next" id={nextButtonId} />
                </>
            )}
        </div>
    );
}
