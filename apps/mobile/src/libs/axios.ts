import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LoginResponseDto } from '~api/app/auth/dtos/login-response.dto';
import authStore from '../stores/authStore';

const requestsQueue: {
    prevRequest: AxiosRequestConfig;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}[] = [];
let isRefreshing = false;

export const axiosInstance = axios.create({
    baseURL: process.env.EXPO_PUBLIC_BASE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (req) => {
        const accessToken = authStore.getState().getAccessToken();
        if (accessToken) {
            req.headers['Authorization'] = `Bearer ${accessToken}`;
        } else {
            delete req.headers['Authorization'];
        }
        return req;
    },
    (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use((response: AxiosResponse) => {
    if (response?.data?.errors) {
        const unauthorizedError = response.data.errors.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error: any) =>
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

axiosInstance.interceptors.response.use(undefined, async (error) => {
    const prevRequest = error?.config;
    if (
        (error?.response?.status === 401 || error?.code === 'GRAPHQL_UNAUTHORIZED') &&
        prevRequest?.sent !== true
    ) {
        prevRequest.sent = true;

        const retryOriginalRequest = new Promise((resolve, reject) => {
            requestsQueue.push({ resolve, reject, prevRequest });
        });

        if (!isRefreshing) {
            isRefreshing = true;

            authStore.getState().setIsLoading(true);
            try {
                const refreshToken = authStore.getState().getRefreshToken();
                const response = await axiosInstance.post<LoginResponseDto>('/api/auth/refresh', {
                    refreshToken,
                });
                authStore.getState().setSession({ user: response.data });

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
                // Check if the refresh token request resulted in a 401 or 403 error
                if (
                    refreshError instanceof AxiosError &&
                    (refreshError.response?.status === 401 || refreshError.response?.status === 403)
                ) {
                    console.error('Refresh token expired or invalid. Logging out user.');
                    authStore.getState().setSession(null); // Clear the session on refresh failure
                } else {
                    // Handle other refresh token errors
                    for (const { reject } of requestsQueue) {
                        reject(error);
                    }
                    console.error('Failed to refresh token:', refreshError);
                    authStore.getState().setSession(null); // Clear the session on refresh failure
                }
            } finally {
                requestsQueue.length = 0;
                isRefreshing = false;
                authStore.getState().setIsLoading(false);
            }
        }

        return retryOriginalRequest;
    }
    return Promise.reject(error);
});

export default axiosInstance;
