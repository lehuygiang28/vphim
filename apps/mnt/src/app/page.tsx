'use client';

import { useGetIdentity } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

import { type UserType } from '~api/app/users/user.type';
import { UserRoleEnum } from '~api/app/users/users.enum';

import LoadingPage from './loading';

export default function Index() {
    const router = useRouter();
    const { data, isLoading } = useGetIdentity<UserType>();

    if (isLoading) {
        return <LoadingPage />;
    }

    if (!isLoading && data?.role !== UserRoleEnum.Admin) {
        signOut({ redirect: false });
        return router.replace('/login');
    }

    return router.replace('/movies');
}
