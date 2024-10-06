import React from 'react';
import MoviesPage from '@/components/pages/movies';
import { HomeOutlined } from '@ant-design/icons';

export default function MovieListPage() {
    return (
        <>
            <MoviesPage
                breadcrumbs={[
                    {
                        label: (
                            <>
                                <HomeOutlined style={{ marginRight: '0.5rem' }} /> Trang chủ
                            </>
                        ),
                        url: '/',
                    },
                    { label: 'Danh sách phim', url: '/danh-sach-phim' },
                ]}
            />
        </>
    );
}
