import type { Metadata } from 'next';
import Layout from '@/components/layout';

export const metadata: Metadata = {
    title: 'Refine',
    description: 'Generated by create refine app',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <Layout>{children}</Layout>;
}