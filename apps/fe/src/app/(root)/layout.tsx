import { LayoutComponent } from '@/components/layout';
import { getCategories } from '@/services/categories';
import { getRegions } from '@/services/regions';

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const categories = await getCategories({
        pagination: {
            current: 1,
            pageSize: 15,
        },
    });
    const regions = await getRegions({
        pagination: {
            current: 1,
            pageSize: 15,
        },
    });

    return (
        <LayoutComponent categories={categories} regions={regions}>
            {children}
        </LayoutComponent>
    );
}
