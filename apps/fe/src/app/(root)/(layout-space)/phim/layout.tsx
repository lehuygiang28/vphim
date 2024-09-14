import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Thông tin phim | VePhim',
    description: 'Thông tin về phim, phim hay theo thể loại, quốc gia, ...',
};

export default function PhimLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
