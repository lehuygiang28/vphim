import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Lịch sử xem phim',
};

export default function WatchHistoryLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
