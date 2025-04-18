import { PropsWithChildren } from 'react';
import { redirect, RedirectType } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/options';

import { LayoutComponent } from '@/components/layout';
import { getCategories } from '@/services/categories';
import { getRegions } from '@/services/regions';

export default async function RequiredAuthLayout({ children }: PropsWithChildren) {
    const auth = await getServerSession(authOptions);
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

    if (!auth?.user) {
        return redirect('/', RedirectType.replace);
    }

    return (
        <LayoutComponent categories={categories} regions={regions}>
            {children}
        </LayoutComponent>
    );
}
