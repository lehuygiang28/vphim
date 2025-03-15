import { GET_ME_QUERY } from '~fe/queries/users';
import type { LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';

import { apiCall, executeQuery } from './apiClient';
import authStore from '../stores/authStore';

/**
 * Error class for authentication-related errors
 */
export class AuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'AuthError';
    }
}

/**
 * Fetches the current user data from the GraphQL API
 * @returns User data with session information or null if unavailable
 */
export const getMe = async (): Promise<(LoginResponseDto & { id: string }) | null> => {
    const user = authStore.getState().getUser();

    try {
        const accessToken = authStore.getState().getAccessToken();

        if (!accessToken) {
            throw new AuthError('No access token available', 'NO_ACCESS_TOKEN');
        }

        // Use our executeQuery utility with forceFetch to avoid refresh loop
        const userData = await executeQuery<{ id: string } & Partial<LoginResponseDto>>(
            GET_ME_QUERY,
            {
                forceFetch: true, // Avoid refresh loop
            },
        );

        if (!userData) {
            throw new AuthError('Failed to get user data from API', 'NO_USER_DATA');
        }

        // Merge existing user data with new data
        const updatedUser = {
            ...user,
            ...userData,
            accessToken,
            refreshToken: user?.refreshToken,
        };

        return updatedUser as LoginResponseDto & { id: string };
    } catch (error) {
        if (error instanceof AuthError) {
            console.error(`Auth error: ${error.message}`, error.code);
        } else {
            console.error('Failed to fetch user data:', error);
        }
        return null;
    }
};

/**
 * Logs the user in with email and one-time password
 * @param email User's email
 * @param otp One-time password received via email
 * @returns True if login successful, false otherwise
 */
export const loginWithOTP = async (email: string, otp: string): Promise<boolean> => {
    try {
        console.log('Attempting login with OTP for email:', email);

        const userData = await apiCall<LoginResponseDto>(
            'POST',
            '/api/auth/login/pwdless/validate',
            {
                hash: otp,
                email: email,
            },
        );

        if (userData && userData.accessToken) {
            console.log('Login successful, received tokens');
            authStore.getState().setSession({ user: userData });
            return true;
        }

        console.warn('Login failed: No valid access token received');
        return false;
    } catch (error) {
        console.error('Login failed:', error);
        return false;
    }
};

/**
 * Initiates the OTP login process by sending an email
 * @param email User's email address
 * @returns True if email sent successfully, false otherwise
 */
export const requestOTP = async (email: string): Promise<boolean> => {
    try {
        console.log('Requesting OTP for email:', email);

        await apiCall('POST', '/api/auth/login/pwdless', {
            email,
            returnUrl: process.env.EXPO_PUBLIC_BASE_PLAYER_URL,
        });

        console.log('OTP request successful');
        return true;
    } catch (error) {
        console.error('Failed to request OTP:', error);
        return false;
    }
};

/**
 * Refreshes the current session by fetching new user data
 * @returns Promise that resolves when refresh is complete
 */
export const refreshSession = async (): Promise<void> => {
    authStore.getState().setIsLoading(true);

    try {
        const refreshToken = authStore.getState().getRefreshToken();

        if (!refreshToken) {
            throw new AuthError('No refresh token available', 'NO_REFRESH_TOKEN');
        }

        // Try to refresh the token
        try {
            const userData = await apiCall<LoginResponseDto>('POST', '/api/auth/refresh', {
                refreshToken,
            });

            if (userData && userData.accessToken) {
                authStore.getState().setSession({ user: userData });
                return;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Fallback to GetMe if token refresh failed
            const updatedUser = await getMe();

            if (updatedUser) {
                authStore.getState().setSession({ user: updatedUser });
                return;
            }
        }

        throw new AuthError('Failed to refresh session', 'REFRESH_FAILED');
    } catch (error) {
        console.error('Failed to refresh session:', error);
        authStore.getState().clearSession();
        throw error;
    } finally {
        authStore.getState().setIsLoading(false);
    }
};

/**
 * Logs the user out by clearing the session
 */
export const logout = (): void => {
    // Attempt to notify the server about logout
    try {
        const accessToken = authStore.getState().getAccessToken();
        if (accessToken) {
            apiCall('POST', '/api/auth/logout', {}).catch(() => {
                // Ignore errors, we're logging out anyway
            });
        }
    } finally {
        // Always clear local session data
        authStore.getState().clearSession();
    }
};
