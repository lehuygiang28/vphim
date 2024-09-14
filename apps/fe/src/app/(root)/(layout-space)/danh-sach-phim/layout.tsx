import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Danh sách phim | VePhim',
    description: 'Danh sách phim, phim hay theo thể loại, quốc gia, ...',
};

export default function DSPhimLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
