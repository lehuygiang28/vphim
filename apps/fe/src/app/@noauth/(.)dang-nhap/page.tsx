'use client';

import { useIsAuthenticated } from '@refinedev/core';
import { Modal } from 'antd';
import { useRouter } from 'next/navigation';
import Login from '@/components/pages/auth/login';
import Loading from '@/app/loading';

export default function LoginParallelPage() {
    const router = useRouter();
    const { data: isAuthData, isLoading: isLoadingAuth } = useIsAuthenticated();

    const handleClose = () => {
        router.back();
    };

    if (isLoadingAuth) {
        return <Loading />;
    }

    if (isAuthData?.authenticated) {
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
            <Login onBack={handleClose} />
        </Modal>
    );
}
