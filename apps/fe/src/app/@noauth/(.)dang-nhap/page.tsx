'use client';

import { useGetIdentity } from '@refinedev/core';
import { Modal } from 'antd';
import { useRouter } from 'next/navigation';

import type { UserType } from 'apps/api/src/app/users/user.type';

import Login from '@/components/pages/auth/login';
import { LoadingSpinner } from '@/components/loading';

export default function LoginParallelPage() {
    const router = useRouter();
    const { data: isAuthData, isLoading: isLoadingAuth } = useGetIdentity<UserType>();

    const handleClose = () => {
        router.back();
    };

    if (isAuthData?.role) {
        router.push('/');
        return <></>;
    }

    return (
        <Modal
            open={true}
            onCancel={handleClose}
            cancelButtonProps={{ hidden: true }}
            okButtonProps={{ hidden: true }}
            centered
        >
            {isLoadingAuth ? <LoadingSpinner /> : <Login onBack={handleClose} />}
        </Modal>
    );
}
