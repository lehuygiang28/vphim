import { useMemo, useCallback } from 'react';
import axios, { AxiosInstance } from 'axios';

import { axiosInstance } from '@/libs/axios';

export type HttpMethodEnum = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type UseAxiosPayload =
    | {
          baseURL?: string;
          headers?: Record<string, string>;
      }
    | undefined;

export function useAxios(payload?: UseAxiosPayload): {
    instance: AxiosInstance;
    request: <T, B = unknown, Q = Record<string, unknown>>(options: {
        method: HttpMethodEnum;
        url: string;
        data?: B;
        params?: Q;
    }) => Promise<T>;
} {
    const instance = useMemo(() => {
        if (payload) {
            const { baseURL, headers } = payload;
            const customInstance = axios.create({
                baseURL: baseURL || axiosInstance.defaults.baseURL,
                headers: { ...axiosInstance.defaults.headers, ...headers },
            });
            return customInstance;
        }

        return axiosInstance;
    }, [payload]);

    const request = useCallback(
        async <T, B = unknown, Q = Record<string, unknown>>(options: {
            method: HttpMethodEnum;
            url: string;
            data?: B;
            params?: Q;
        }): Promise<T> => {
            const response = await instance.request<T>({
                ...options,
                url: options.url,
                data: options.data,
                params: options.params,
            });
            return response.data;
        },
        [instance],
    );

    return { instance, request };
}
