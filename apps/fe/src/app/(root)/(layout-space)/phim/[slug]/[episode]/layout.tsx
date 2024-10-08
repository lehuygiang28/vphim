import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Xem phim',
};

export default function PhimLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
