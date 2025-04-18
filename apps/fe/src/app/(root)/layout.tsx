import { LayoutComponent } from '@/components/layout';
import { getCategories } from '@/services/categories';
import { getRegions } from '@/services/regions';

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [categories, regions] = await Promise.all([
        getCategories({
            pagination: {
                current: 1,
                pageSize: 200,
            },
        }),
        getRegions({
            pagination: {
                current: 1,
                pageSize: 200,
            },
        }),
    ]);

    return (
        <LayoutComponent categories={categories} regions={regions}>
            {children}
        </LayoutComponent>
    );
}
