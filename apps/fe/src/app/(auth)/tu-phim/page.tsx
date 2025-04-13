'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOne } from '@refinedev/core';
import { Empty, List, Grid, Breadcrumb, Divider } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

import type { MovieType } from 'apps/api/src/app/movies/movie.type';
import type { UserType } from 'apps/api/src/app/users/user.type';

import { GET_OWN_FOLLOWING_MOVIES_WITH_DETAILS } from '@/queries/users';
import { MovieCard } from '@/components/card/movie-card';
import { MOVIES_LIST_QUERY } from '@/queries/movies';
import LazyMovieList from '@/components/list/movie-lazy-list';

const { useBreakpoint } = Grid;

const PER_PAGE = 24;
export default function MovieFollowingsPage() {
    const router = useRouter();
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

    const [currentPage, setCurrentPage] = useState(1);

    const paginatedMovies = useMemo(() => {
        if (!followMovies?.followMovies) return [];
        const startIndex = (currentPage - 1) * PER_PAGE;
        return followMovies.followMovies.slice(startIndex, startIndex + PER_PAGE);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [followMovies, currentPage, PER_PAGE]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <>
            <div
                className="layout-space-container"
                style={{
                    marginLeft: md ? '3rem' : '0.7rem',
                    marginRight: md ? '3rem' : '0.7rem',
                    paddingBottom: '2rem',
                    position: 'relative',
                    zIndex: 1,
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
                                <Empty description="Chưa có phim trong tủ" />
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
                                onClick={() => {
                                    router.push(`/phim/${item.slug}`);
                                }}
                            >
                                <MovieCard movie={item} />
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
            </div>

            <LazyMovieList
                title="Có thể bạn quan tâm"
                movieAsset={{
                    filters: [],
                    sorters: [
                        {
                            field: 'view',
                            order: 'desc',
                        },
                    ],
                }}
                gqlQuery={MOVIES_LIST_QUERY}
            />
        </>
    );
}
