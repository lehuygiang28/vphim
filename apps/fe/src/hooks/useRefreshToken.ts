import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

import type { LoginResponseDto } from 'apps/api/src/app/auth/dtos/login-response.dto';

import { useAxios } from './useAxios';
import { AxiosError } from 'axios';

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
            if (error instanceof AxiosError) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.error('Refresh token invalid or expired:', error);
                    await signOut();
                    throw new Error('Session expired. Please log in again.');
                } else if (error.code === 'ERR_NETWORK') {
                    console.error('Network error during token refresh:', error);
                    throw error; // Reject with the original error for network issues
                }
            }
            console.error('Failed to refresh tokens:', error);
            throw error; // Reject with the original error for other cases
        } finally {
            setIsRefreshing(false);
        }
    };

    return refreshToken;
}
