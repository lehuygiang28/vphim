import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';
import { LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';
import authStore, { Session } from '../stores/authStore';

interface RetryQueueItem {
    prevRequest: InternalAxiosRequestConfig;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
    '/api/auth/login/pwdless',          // Request OTP
    '/api/auth/login/pwdless/validate', // Login with OTP
    '/api/auth/refresh',                // Refresh token
    '/api/auth/register'                // Registration
];

/**
 * Check if an endpoint is public (doesn't require authentication)
 */
const isPublicEndpoint = (url?: string): boolean => {
    if (!url) return false;
    return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

const requestsQueue: RetryQueueItem[] = [];
let isRefreshing = false;

export const axiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BASE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds timeout
});

// Add request interceptor with proper typing
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        // Skip auth for public endpoints or if explicitly marked with Skip-Auth-Check
        const skipAuthCheck =
            isPublicEndpoint(config.url) ||
            config.headers['Skip-Auth-Check'] === 'true';

        // Remove the Skip-Auth-Check header before sending the request
        if (config.headers['Skip-Auth-Check']) {
            delete config.headers['Skip-Auth-Check'];
        }

        // Only add Authorization header for protected endpoints
        if (!skipAuthCheck) {
            const accessToken = authStore.getState().getAccessToken();
            if (accessToken) {
                config.headers['Authorization'] = `Bearer ${accessToken}`;
            } else {
                delete config.headers['Authorization'];
            }
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// Add response interceptor for GraphQL errors
axiosInstance.interceptors.response.use((response: AxiosResponse) => {
    // Check for GraphQL errors indicating auth issues
    if (response?.data?.errors) {
        const unauthorizedError = response.data.errors.find(
            (error: { message?: string; extensions?: { code?: string } }) =>
                error?.message?.toLowerCase() === 'unauthorized' ||
                error?.extensions?.code === 'UNAUTHENTICATED',
        );
        if (unauthorizedError) {
            return Promise.reject(
                new AxiosError(
                    'Unauthorized',
                    'GRAPHQL_UNAUTHORIZED',
                    response.config,
                    response.request,
                    response,
                ),
            );
        }
    }
    return response;
}, undefined);

// Add token refresh interceptor
axiosInstance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const prevRequest = error.config as InternalAxiosRequestConfig & { sent?: boolean };

    // Skip token refresh for public endpoints or if already retried
    if (
        // Check if this is an auth error (401 or GraphQL unauthorized)
        (error?.response?.status === 401 || error?.code === 'GRAPHQL_UNAUTHORIZED') &&
        // Check if request hasn't been retried yet
        prevRequest?.sent !== true &&
        // Skip for public endpoints
        !isPublicEndpoint(prevRequest?.url)
    ) {
        prevRequest.sent = true;

        // Create a promise that will be resolved when token refresh is complete
        const retryOriginalRequest = new Promise((resolve, reject) => {
            requestsQueue.push({ resolve, reject, prevRequest });
        });

        if (!isRefreshing) {
            isRefreshing = true;

            // Set loading state
            authStore.getState().setIsLoading(true);

            try {
                const refreshToken = authStore.getState().getRefreshToken();

                // Don't proceed if refresh token is missing
                if (!refreshToken) {
                    throw new AxiosError('Missing refresh token', 'MISSING_REFRESH_TOKEN');
                }

                // Attempt to refresh the token - Skip-Auth-Check is added by apiCall in authActions.ts
                const response = await axiosInstance.post<LoginResponseDto>(
                    '/api/auth/refresh',
                    { refreshToken },
                    { headers: { 'Skip-Auth-Check': 'true' } }
                );

                // Update auth state with new tokens
                authStore.getState().setSession({
                    user: response.data,
                    expiresAt: Date.now() + 3600 * 1000, // 1 hour expiry or use token expiry if available
                });

                console.log('Token successfully refreshed');

                // Retry all queued requests with the new token
                for (const req of requestsQueue) {
                    const { resolve, prevRequest } = req;
                    const updatedRequest = {
                        ...prevRequest,
                        headers: {
                            ...prevRequest.headers,
                            Authorization: `Bearer ${response.data.accessToken}`,
                        },
                    };
                    resolve(axiosInstance(updatedRequest));
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);

                // Check if the refresh token request resulted in an auth error
                if (
                    refreshError instanceof AxiosError &&
                    (refreshError.response?.status === 401 || refreshError.response?.status === 403)
                ) {
                    console.error('Refresh token expired or invalid. Logging out user.');
                    authStore.getState().clearSession(); // Clear the session on refresh failure

                    // Reject all queued requests
                    for (const { reject } of requestsQueue) {
                        reject(new AxiosError('Session expired', 'SESSION_EXPIRED'));
                    }
                } else {
                    // Handle other refresh token errors
                    for (const { reject } of requestsQueue) {
                        reject(refreshError);
                    }
                    authStore.getState().clearSession(); // Clear the session on refresh failure
                }
            } finally {
                requestsQueue.length = 0;
                isRefreshing = false;
                authStore.getState().setIsLoading(false);
            }
        }

        return retryOriginalRequest;
    }

    // If error is from a refresh token request, clear the session
    if (prevRequest?.url?.includes('/api/auth/refresh')) {
        authStore.getState().clearSession();
    }

    return Promise.reject(error);
});

export default axiosInstance;
