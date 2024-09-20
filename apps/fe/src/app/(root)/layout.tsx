import type { Metadata } from 'next';
import { LayoutComponent } from '@/components/layout';

export const metadata: Metadata = {
    title: 'VePhim - Xem phim miễn phí, phim hay theo thể loại, quốc gia, ...',
    description: 'Xem phim miễn phí, phim hay theo thể loại, quốc gia, ...',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <LayoutComponent>{children}</LayoutComponent>;
}
