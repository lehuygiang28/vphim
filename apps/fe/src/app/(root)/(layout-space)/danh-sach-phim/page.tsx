import MoviePage from '@/components/pages/movies';
import { HomeOutlined } from '@ant-design/icons';

export default function MoviesPage() {
    return (
        <>
            <MoviePage
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
