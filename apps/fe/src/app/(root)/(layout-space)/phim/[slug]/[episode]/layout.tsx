import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Xem phim | VePhim',
    description: 'Xem phim, phim hay theo thể loại, quốc gia, ...',
};

export default function PhimLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
