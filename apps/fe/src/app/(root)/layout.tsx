import { LayoutComponent } from '@/components/layout';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <LayoutComponent>{children}</LayoutComponent>;
}
