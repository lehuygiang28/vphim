import { PropsWithChildren } from 'react';
import { redirect, RedirectType } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/options';

export default async function RequiredAuthLayout({ children }: PropsWithChildren) {
    const auth = await getServerSession(authOptions);

    if (!auth?.user) {
        return redirect('/', RedirectType.replace);
    }

    return <div className="layout-space-container">{children}</div>;
}
