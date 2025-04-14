import { print } from 'graphql/language/printer';
import type { DocumentNode } from 'graphql';
import { AxiosRequestConfig } from 'axios';
import axiosInstance from './axios';
import authStore from '../stores/authStore';

interface GraphQLResponse<T> {
    data?: {
        [key: string]: T;
    };
    errors?: Array<{
        message: string;
        extensions?: {
            code?: string;
        };
    }>;
}

interface GraphQLOptions {
    variables?: Record<string, unknown>;
    operationName?: string;
    forceFetch?: boolean;
}

// List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
    '/api/auth/login/pwdless', // Request OTP
    '/api/auth/login/pwdless/validate', // Login with OTP
    '/api/auth/refresh', // Refresh token
    '/api/auth/register', // Registration
];

/**
 * Check if an endpoint is public (doesn't require authentication)
 */
const isPublicEndpoint = (url: string): boolean => {
    return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

/**
 * Execute a GraphQL query with automatic token handling and refresh
 *
 * @param query The GraphQL query document
 * @param options Query options including variables
 * @returns The query result data or null
 */
export async function executeQuery<T = unknown>(
    query: DocumentNode,
    options: GraphQLOptions = {},
): Promise<T | null> {
    try {
        // Check if token is expired and refresh if needed
        if (authStore.getState().isSessionExpired() && !options.forceFetch) {
            // Dynamically import refreshSession to avoid circular dependency
            const { refreshSession } = await import('./authActions');
            await refreshSession();
        }

        const response = await axiosInstance.post<GraphQLResponse<T>>('/graphql', {
            query: print(query),
            variables: options.variables || {},
        });

        if (response.data?.errors?.length) {
            console.error('GraphQL errors:', response.data.errors);
            throw new Error(response.data.errors[0].message);
        }

        if (!response.data?.data) {
            return null;
        }

        // Return the first result key's value
        const keys = Object.keys(response.data.data);
        if (keys.length === 0) {
            return null;
        }

        return response.data.data[keys[0]] as T;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

/**
 * Execute a GraphQL mutation with automatic token handling and refresh
 *
 * @param mutation The GraphQL mutation document
 * @param options Mutation options including variables
 * @returns The mutation result data or null
 */
export async function executeMutation<T = unknown>(
    mutation: DocumentNode,
    options: GraphQLOptions = {},
): Promise<T | null> {
    return executeQuery<T>(mutation, options);
}

/**
 * Perform a REST API call with automatic token handling
 *
 * @param method HTTP method
 * @param url API endpoint
 * @param data Request payload
 * @param config Additional axios config
 * @returns Response data
 */
export async function apiCall<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: unknown,
    config: AxiosRequestConfig = {},
): Promise<T> {
    try {
        // Skip token refresh for public endpoints
        if (!isPublicEndpoint(url) && authStore.getState().isSessionExpired()) {
            // Dynamically import refreshSession to avoid circular dependency
            const { refreshSession } = await import('./authActions');
            await refreshSession();
        }

        // For public endpoints, make sure we don't add auth headers
        const requestConfig: AxiosRequestConfig = {
            ...config,
            headers: {
                ...(config.headers || {}),
            },
            method,
            url,
            data,
        };

        // Add Skip-Auth-Check header for public endpoints
        if (isPublicEndpoint(url)) {
            requestConfig.headers = {
                ...requestConfig.headers,
                'Skip-Auth-Check': 'true',
            };
        }

        const response = await axiosInstance(requestConfig);
        return response.data;
    } catch (error) {
        console.error(`${method} request to ${url} failed:`, error);
        throw error;
    }
}
