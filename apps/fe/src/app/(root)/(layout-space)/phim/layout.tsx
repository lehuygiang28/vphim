import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Thông tin phim',
};

export default function PhimLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
