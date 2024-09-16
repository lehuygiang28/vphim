'use client';

import { PropsWithChildren } from 'react';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useGetIdentity } from '@refinedev/core';
import { signOut } from 'next-auth/react';

import { UserRoleEnum } from '~api/app/users/users.enum';
import { type UserType } from '~api/app/users/user.type';

import LoadingPage from '../loading';
import { ThemedLayout } from '~mnt/components/themed-layout';

export default function AdminLayout({ children }: PropsWithChildren) {
    const router = useRouter();
    const { data, isLoading } = useIsAuthenticated();
    const { data: user, isLoading: isIdentityLoading } = useGetIdentity<UserType>();

    if (isLoading || isIdentityLoading) {
        return <LoadingPage />;
    }

    if (!data?.authenticated) {
        return router.replace('/login');
    }

    if (user?.role !== UserRoleEnum.Admin) {
        signOut();
        return router.replace('/login');
    }

    return <ThemedLayout>{children}</ThemedLayout>;
}
