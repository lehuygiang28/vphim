'use client';

import MoviePage from '@/components/pages/movies';

export default function MoviesPage() {
    return (
        <>
            <MoviePage
                breadcrumbs={[
                    { label: 'Trang chủ', url: '/' },
                    { label: 'Danh sách phim', url: '/danh-sach-phim' },
                ]}
            />
        </>
    );
}
