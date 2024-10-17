import { useState, useCallback } from 'react';
import axios from 'axios';
import { useSession } from './useSession';
import { type LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';

export function useRefreshToken() {
    const { session, updateSession, clearSession } = useSession();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshToken = useCallback(async () => {
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
    }, [isRefreshing, session, updateSession, clearSession]);

    return refreshToken;
}
