'use client';

import { useGetIdentity } from '@refinedev/core';
import { Modal } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import type { UserType } from 'apps/api/src/app/users/user.type';

import Login from '@/components/pages/auth/login';
import { LoadingSpinner } from '@/components/loading';

export default function LoginParallelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: user, isLoading: isLoadingAuth } = useGetIdentity<UserType>();

    const redirectPath = searchParams.get('to') || '/';

    // Close modal and go back to previous route
    const handleClose = useCallback(() => {
        router.back();
    }, [router]);

    // If user is already authenticated, redirect appropriately
    useEffect(() => {
        if (user?.role && !isLoadingAuth) {
            // Small delay to ensure smooth transition
            router.push(redirectPath);
        }
    }, [user, isLoadingAuth, router, redirectPath]);

    if (user?.role) {
        return <LoadingSpinner />;
    }

    return (
        <Modal
            open={true}
            onCancel={handleClose}
            cancelButtonProps={{ hidden: true }}
            okButtonProps={{ hidden: true }}
            centered
            maskClosable={true}
            className="auth-modal"
            width={600}
            styles={{
                body: {
                    padding: '24px',
                    borderRadius: '8px',
                },
                mask: {
                    backdropFilter: 'blur(4px)',
                    background: 'rgba(0, 0, 0, 0.45)',
                },
            }}
            destroyOnClose
        >
            {isLoadingAuth ? <LoadingSpinner /> : <Login onBack={handleClose} />}
        </Modal>
    );
}
