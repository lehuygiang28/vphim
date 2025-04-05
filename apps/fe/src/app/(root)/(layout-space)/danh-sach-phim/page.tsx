import React from 'react';
import { HomeOutlined } from '@ant-design/icons';

import MoviesPage from '@/components/pages/movies';
import { getCategories } from '@/services/categories';
import { getRegions } from '@/services/regions';

export default async function MovieListPage() {
    const [categories, regions] = await Promise.all([
        getCategories({
            pagination: {
                current: 1,
                pageSize: 1000,
            },
        }),
        getRegions({
            pagination: {
                current: 1,
                pageSize: 1000,
            },
        }),
    ]);
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
                categories={categories}
                regions={regions}
            />
        </>
    );
}
