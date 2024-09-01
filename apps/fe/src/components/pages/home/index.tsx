import React from 'react';
import { Layout } from 'antd';

import Header from './header';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { MovieSwiper } from '@/components/swiper/movie';
import { useList } from '@refinedev/core';

import { Movie } from 'apps/api/src/app/movies/movie.schema';

const { Content, Footer } = Layout;

export function Home() {
    const { data: res } = useList<Movie>({
        resource: 'movies',
        filters: [
            {
                field: 'keywords',
                value: 'spider',
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
            </Content>
            <Footer></Footer>
        </Layout>
    );
}
