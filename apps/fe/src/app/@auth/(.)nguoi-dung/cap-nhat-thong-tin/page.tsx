'use client';

import { useIsAuthenticated } from '@refinedev/core';
import { Modal } from 'antd';
import { useRouter } from 'next/navigation';

import { UserUpdateComponent } from '@/components/pages/user/update';
import { LoadingSpinner } from '@/components/loading';

export default function LoginParallelPage() {
    const router = useRouter();
    const { data: isAuthData, isLoading: isLoadingAuth } = useIsAuthenticated();

    const handleClose = () => {
        router.back();
    };

    if (!isAuthData?.authenticated) {
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
            {isLoadingAuth ? <LoadingSpinner /> : <UserUpdateComponent onBack={handleClose} />}
        </Modal>
    );
}
