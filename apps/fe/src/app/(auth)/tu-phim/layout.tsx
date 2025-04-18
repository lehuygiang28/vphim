import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tủ phim của bạn',
};

export default function FollowedMoviesLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <>{children}</>;
}
