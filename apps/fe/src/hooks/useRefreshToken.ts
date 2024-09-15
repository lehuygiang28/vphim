import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import type { LoginResponseDto } from 'apps/api/src/app/auth/dtos';
import { useAxios } from './useAxios';

export function useRefreshToken() {
    const { instance: axiosInstance } = useAxios();
    const { data: session, update } = useSession();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshToken = async () => {
        if (isRefreshing || !session?.user.refreshToken) {
            return;
        }

        setIsRefreshing(true);

        try {
            const path = '/api/auth/refresh';
            const res = await axiosInstance.post<LoginResponseDto>(path, {
                refreshToken: session.user.refreshToken,
            });

            session.user = {
                ...(
                    await update({
                        ...session,
                        user: { ...session?.user, ...res.data },
                    })
                )?.user,
            };
        } catch (error) {
            console.error('Failed to refresh tokens:', error);
            return signOut();
        } finally {
            setIsRefreshing(false);
        }
    };

    return refreshToken;
}
