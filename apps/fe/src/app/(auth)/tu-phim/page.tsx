'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useOne, useList, stringifyTableParams } from '@refinedev/core';
import { Empty, List, Grid, Breadcrumb, Divider } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { GET_OWN_FOLLOWING_MOVIES_WITH_DETAILS } from '@/queries/users';
import { MovieCard } from '@/components/card/movie-card';
import { MovieType } from 'apps/api/src/app/movies/movie.type';
import { UserType } from 'apps/api/src/app/users/user.type';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import MovieList from '@/components/swiper/movie-list';
import { RouteNameEnum } from '@/constants/route.constant';

const { useBreakpoint } = Grid;

const PER_PAGE = 24;
export default function MovieFollowingsPage() {
    const { md } = useBreakpoint();
    const {
        data: { data: followMovies } = {},
        isLoading,
        isRefetching,
    } = useOne<Pick<UserType, 'followMovies'>>({
        dataProviderName: 'graphql',
        resource: 'users',
        id: 'me',
        meta: {
            gqlQuery: GET_OWN_FOLLOWING_MOVIES_WITH_DETAILS,
            operation: 'getMe',
        },
    });

    const { data: mostViewedMovies, isLoading: mostViewedLoading } = useList<MovieType>({
        dataProviderName: 'graphql',
        meta: { gqlQuery: MOVIES_LIST_QUERY },
        resource: 'movies',
        sorters: [
            {
                field: 'view',
                order: 'desc',
            },
        ],
    });

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const handleVisibleContentCard = (index: number | null) => {
        setSelectedIndex(index === selectedIndex ? null : index);
    };

    const paginatedMovies = useMemo(() => {
        if (!followMovies?.followMovies) return [];
        const startIndex = (currentPage - 1) * PER_PAGE;
        return followMovies.followMovies.slice(startIndex, startIndex + PER_PAGE);
    }, [followMovies, currentPage, PER_PAGE]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div
            style={{
                marginTop: md ? '6rem' : '5rem',
                marginLeft: md ? '3rem' : '0.7rem',
                marginRight: md ? '3rem' : '0.7rem',
            }}
        >
            <Breadcrumb
                style={{ marginBottom: '1rem' }}
                items={[
                    {
                        title: (
                            <Link href={'/'}>
                                <HomeOutlined style={{ marginRight: '0.5rem' }} />
                                Trang chủ
                            </Link>
                        ),
                    },
                    {
                        title: <Link href={'/tu-phim'}>Tủ phim</Link>,
                    },
                ]}
            />
            <Divider />
            <List
                loading={isLoading || isRefetching}
                grid={{
                    gutter: [16, 36],
                    xs: 2,
                    sm: 2,
                    md: 3,
                    lg: 4,
                    xl: 6,
                    xxl: 8,
                }}
                locale={{
                    emptyText: (
                        <>
                            <Empty description="Không tìm thấy phim" />
                        </>
                    ),
                }}
                dataSource={paginatedMovies}
                renderItem={(item: MovieType, index) => (
                    <List.Item>
                        <div
                            style={{
                                height: md ? '19rem' : '17rem',
                            }}
                            onClick={() => handleVisibleContentCard(index)}
                            onMouseEnter={() => handleVisibleContentCard(index)}
                            onMouseLeave={() => handleVisibleContentCard(null)}
                        >
                            <MovieCard
                                movie={item}
                                visibleContent={selectedIndex === index}
                                scale={md ? undefined : 1.1}
                            />
                        </div>
                    </List.Item>
                )}
                pagination={
                    isLoading || followMovies?.followMovies?.length <= PER_PAGE
                        ? false
                        : {
                              style: { marginTop: '2rem' },
                              current: currentPage,
                              pageSize: PER_PAGE,
                              total: followMovies?.followMovies?.length,
                              showSizeChanger: false,
                              onChange: (page) => handlePageChange(page),
                          }
                }
            />
            <Divider style={{ marginTop: '4rem' }} />
            <MovieList
                title="Có thể bạn quan tâm"
                isLoading={mostViewedLoading}
                movies={mostViewedMovies?.data}
                disableNavigation
                viewMoreHref={`${RouteNameEnum.MOVIE_LIST_PAGE}?${stringifyTableParams({
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                    filters: [],
                })}`}
            />
        </div>
    );
}
