import type { Metadata } from 'next';
import { LayoutComponent } from '@/components/layout';

export const metadata: Metadata = {
    title: 'Tủ phim của bạn',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <LayoutComponent>{children}</LayoutComponent>;
}
