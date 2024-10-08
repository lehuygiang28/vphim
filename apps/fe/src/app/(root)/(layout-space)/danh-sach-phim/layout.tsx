import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Danh sách phim',
};

export default function DSPhimLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
