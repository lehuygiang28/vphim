import { useState } from 'react';
import axios from 'axios';
import { useSession } from './useSession';
import { type LoginResponseDto } from 'apps/api/src/app/auth/dtos';

export function useRefreshToken() {
    const { session, updateSession, clearSession } = useSession();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshToken = async () => {
        if (isRefreshing || !session?.user.refreshToken) {
            return;
        }

        setIsRefreshing(true);

        try {
            const response = await axios.post<LoginResponseDto>('/api/auth/refresh', {
                refreshToken: session.user.refreshToken,
            });

            const updatedSession = {
                ...session,
                user: {
                    ...session.user,
                    ...response.data,
                },
            };

            await updateSession(updatedSession);
        } catch (error) {
            console.error('Failed to refresh tokens:', error);
            await clearSession();
        } finally {
            setIsRefreshing(false);
        }
    };

    return refreshToken;
}
