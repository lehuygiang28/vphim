import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import React, { useState } from 'react';
import { Layout } from 'antd';
import { useList } from '@refinedev/core';

import { MovieResponseDto } from 'apps/api/src/app/movies/dtos';
import MovieList from '@/components/swiper/movie-list';
import { MovieSwiper } from '@/components/swiper/movie';

import Header from './header';

const { Content, Footer } = Layout;

export function Home() {
    const [activeList, setActiveList] = useState<string | null>(null);

    const { data: mostViewed } = useList<MovieResponseDto>({
        resource: 'movies',
        sorters: [
            {
                field: 'view',
                order: 'desc',
            },
        ],
    });

    const { data: newMovies } = useList<MovieResponseDto>({
        resource: 'movies',
        filters: [
            {
                field: 'years',
                value: '2024, 2023',
                operator: 'eq',
            },
        ],
        sorters: [
            {
                field: 'year',
                order: 'asc',
            },
        ],
    });
    const { data: actionMovies } = useList<MovieResponseDto>({
        resource: 'movies',
        filters: [
            {
                field: 'categories',
                value: 'hanh-dong',
                operator: 'eq',
            },
        ],
    });

    const { data: cartoonMovies } = useList<MovieResponseDto>({
        resource: 'movies',
        filters: [
            {
                field: 'categories',
                value: 'hoat-hinh,',
                operator: 'eq',
            },
        ],
    });

    return (
        <Layout
            style={{
                overflowX: 'hidden',
            }}
        >
            <Header />
            <Content
                style={{
                    minHeight: '300vh',
                    position: 'relative',
                }}
            >
                <MovieSwiper movies={mostViewed?.data} />

                <div
                    onClick={() => setActiveList('newMovies')}
                    style={{
                        marginTop: '1rem',
                    }}
                >
                    <MovieList
                        clearVisibleContentCard={activeList !== 'newMovies'}
                        title="PHIM MỚI"
                        movies={newMovies?.data}
                    />
                </div>

                <div
                    onClick={() => setActiveList('actionMovies')}
                    style={{
                        marginTop: '1rem',
                    }}
                >
                    <MovieList
                        clearVisibleContentCard={activeList !== 'actionMovies'}
                        title="PHIM HÀNH ĐỘNG"
                        movies={actionMovies?.data}
                        viewMoreHref={'/the-loai/hanh-dong'}
                    />
                </div>

                <div
                    onClick={() => setActiveList('cartoonMovies')}
                    style={{
                        marginTop: '1rem',
                    }}
                >
                    <MovieList
                        clearVisibleContentCard={activeList !== 'cartoonMovies'}
                        title="PHIM HOẠT HÌNH"
                        movies={cartoonMovies?.data}
                        viewMoreHref={'/the-loai/hoat-hinh'}
                    />
                </div>
            </Content>
            <Footer></Footer>
        </Layout>
    );
}
