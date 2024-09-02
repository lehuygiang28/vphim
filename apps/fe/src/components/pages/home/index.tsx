import React from 'react';
import { Layout } from 'antd';

import Header from './header';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { MovieSwiper } from '@/components/swiper/movie';
import { useList } from '@refinedev/core';

import { Movie } from 'apps/api/src/app/movies/movie.schema';
import MovieList from '@/components/swiper/movie-list';

const { Content, Footer } = Layout;

export function Home() {
    const { data: res } = useList<Movie>({
        resource: 'movies',
    });

    const { data: actionMovies } = useList<Movie>({
        resource: 'movies',
        filters: [
            {
                field: 'keywords',
                value: 'action',
                operator: 'eq',
            },
        ],
    });

    const { data: loveMovies } = useList<Movie>({
        resource: 'movies',
        filters: [
            {
                field: 'keywords',
                value: 'anime',
                operator: 'eq',
            },
        ],
    });
    return (
        <Layout>
            <Header />
            <Content
                style={{
                    minHeight: '300vh',
                    position: 'relative',
                }}
            >
                <MovieSwiper movies={res?.data} />
                <MovieList
                    title="PHIM HÀNH ĐỘNG"
                    movies={actionMovies?.data}
                    style={{
                        marginTop: '1rem',
                    }}
                />
                <MovieList
                    title="PHIM ANIME"
                    movies={loveMovies?.data}
                    style={{
                        marginTop: '1rem',
                    }}
                />
            </Content>
            <Footer></Footer>
        </Layout>
    );
}
