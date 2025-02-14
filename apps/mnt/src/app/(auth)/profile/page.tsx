'use client';

import { useRouter } from 'next/navigation';
import { Modal } from 'antd';
import { useIsAuthenticated } from '@refinedev/core';

import { LoadingSpinner } from '~fe/components/loading';
import { UserUpdateComponent } from '~fe/components/pages/user/update';

export default function ProfileParallelPage() {
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
