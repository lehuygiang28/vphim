import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LoginResponseDto } from 'apps/api/src/app/auth/dtos';
import { useAxios } from './useAxios';

export function useRefreshToken() {
    const { instance: axiosInstance } = useAxios();
    const { data: session } = useSession();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshToken = async () => {
        if (isRefreshing || !session?.user.refreshToken) {
            return;
        }

        setIsRefreshing(true);

        try {
            const path = '/auth/refresh';
            const res = await axiosInstance.post<LoginResponseDto>(path, {
                refreshToken: session.user.refreshToken,
            });

            session.user = res.data;
        } catch (error) {
            console.error('Failed to refresh tokens:', error);
            signOut();
        } finally {
            setIsRefreshing(false);
        }
    };

    return refreshToken;
}
