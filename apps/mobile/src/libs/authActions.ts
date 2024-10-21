// authActions.ts
import { print } from 'graphql/language/printer';

import { GET_ME_QUERY } from '~fe/queries/users';
import type { LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';

import axiosInstance from '~mb/libs/axios';
import authStore from '../stores/authStore';

const getMe = async (): Promise<(LoginResponseDto & { id: string }) | null> => {
    const user = authStore.getState().getUser();

    try {
        const accessToken = authStore.getState().getAccessToken();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await axiosInstance.post<any>(
            '/graphql',
            {
                query: print(GET_ME_QUERY),
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        const getMe = response.data?.data?.getMe;
        if (!getMe) {
            return null;
        }

        const updatedUser = { ...user, ...getMe, accessToken, refreshToken: user?.refreshToken };
        return updatedUser;
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        return null;
    }
};

export const refreshSession = async (): Promise<void> => {
    authStore.getState().setIsLoading(true);
    try {
        const updatedUser = await getMe();
        if (updatedUser) {
            authStore.getState().setSession({ user: updatedUser });
        } else {
            throw new Error('Failed to refresh session');
        }
    } catch (error) {
        console.error('Failed to refresh session:', error);
        authStore.getState().clearSession();
    } finally {
        authStore.getState().setIsLoading(false);
    }
};
