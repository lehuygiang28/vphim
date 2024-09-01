import { HttpError } from '@refinedev/core';
import axios from 'axios';
import { baseApiUrl } from '@/config';

const axiosInstance = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
    baseURL: baseApiUrl,
});

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const customError: HttpError = {
            ...error,
            message: error?.response?.data?.detail ?? error.response?.data?.message,
            statusCode: error.response?.status ?? error.response?.statusCode,
        };

        return Promise.reject(customError);
    },
);

export { axiosInstance };
export default axiosInstance;
