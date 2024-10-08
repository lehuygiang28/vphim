import { useEffect, useMemo } from 'react';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useSession } from './useSession';
import { useRefreshToken } from './useRefreshToken';

interface UseAxiosAuthOptions {
    baseURL?: string;
}

const createAxiosInstance = (baseURL?: string): AxiosInstance => {
    return axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};

const requestsQueue: {
    prevRequest: AxiosRequestConfig;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}[] = [];
let isRefreshing = false;

export function useAxiosAuth(options?: UseAxiosAuthOptions) {
    const { session, loading, updateSession } = useSession();
    const refreshToken = useRefreshToken();

    const axiosInstance = useMemo(() => createAxiosInstance(options?.baseURL), [options?.baseURL]);

    useEffect(() => {
        if (loading) return;

        if (session?.user?.accessToken) {
            axiosInstance.defaults.headers['Authorization'] = `Bearer ${session.user.accessToken}`;
        }

        const requestInterceptor = axiosInstance.interceptors.request.use(
            (config) => {
                if (!config.headers['Authorization'] && session?.user?.accessToken) {
                    config.headers['Authorization'] = `Bearer ${session.user.accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error),
        );

        const graphqlResponseInterceptor = axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                // Check for GraphQL errors
                if (response?.data?.errors) {
                    const unauthorizedError = response.data.errors.find(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (error: any) =>
                            error?.message?.toLowerCase() === 'unauthorized' ||
                            error?.extensions?.code === 'UNAUTHENTICATED',
                    );
                    if (unauthorizedError) {
                        // Throw a custom error to trigger the refresh flow
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
            },
            undefined,
        );

        const responseInterceptor = axiosInstance.interceptors.response.use(
            undefined,
            async (error: AxiosError) => {
                const prevRequest = error.config as AxiosRequestConfig & { sent?: boolean };
                if (
                    (error.response?.status === 401 || error?.code === 'GRAPHQL_UNAUTHORIZED') &&
                    prevRequest &&
                    !prevRequest.sent
                ) {
                    prevRequest.sent = true;

                    // Create a Promise to pause the request
                    const retryOriginalRequest = new Promise((resolve, reject) => {
                        // Queue the request with its resolve/reject handlers
                        requestsQueue.push({ resolve, reject, prevRequest });
                    });

                    if (!isRefreshing) {
                        isRefreshing = true;

                        try {
                            await refreshToken();
                            // Retry all queued requests
                            for (const req of requestsQueue) {
                                const { resolve, prevRequest } = req;
                                prevRequest.headers = {
                                    ...prevRequest.headers,
                                    Authorization: `Bearer ${session?.user?.accessToken}`,
                                };
                                resolve(axiosInstance(prevRequest));
                            }
                        } catch (refreshError) {
                            // Handle refresh token error
                            for (const { reject } of requestsQueue) {
                                reject(error);
                            }
                            console.error('Failed to refresh token:', refreshError);
                            // You might want to sign out the user here
                            // await clearSession();
                        } finally {
                            requestsQueue.length = 0; // Clear the queue
                            isRefreshing = false;
                        }
                    }

                    return retryOriginalRequest;
                }
                return Promise.reject(error);
            },
        );

        return () => {
            axiosInstance.interceptors.request.eject(requestInterceptor);
            axiosInstance.interceptors.response.eject(graphqlResponseInterceptor);
            axiosInstance.interceptors.response.eject(responseInterceptor);
        };
    }, [axiosInstance, session, refreshToken, loading, updateSession]);

    return axiosInstance;
}
