'use client';

import { AuthProvider } from '@refinedev/core';
import { signIn, getSession, signOut } from 'next-auth/react';
import { AxiosError, AxiosInstance } from 'axios';
import { print } from 'graphql/language/printer';
import { axiosInstance } from '@/libs/axios';

import { type ProblemDetails } from 'apps/api/src/libs/dtos';
import type { LoginResponseDto } from 'apps/api/src/app/auth/dtos';

import type { LoginActionPayload, LoginAction, RequestLoginAction } from './types/login.type';
import {
    RegisterAction,
    RegisterActionPayload,
    RequestRegisterAction,
} from './types/register.type';
import { RouteNameEnum } from '@/constants/route.constant';
import { GET_ME_QUERY } from '@/queries/users';

export const authProvider = (
    _axios: AxiosInstance = axiosInstance,
    authAxios: AxiosInstance = axiosInstance,
): AuthProvider => {
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api`;

    return {
        login: async ({ type, ...data }: LoginActionPayload) => {
            if (type === 'request-login') {
                const path = `${baseUrl}/auth/login/pwdless`;
                const requestData = data as RequestLoginAction;

                return _axios
                    .post<void>(path, requestData)
                    .then(() => {
                        return {
                            success: true,
                            redirectTo: RouteNameEnum.LOGIN_PAGE,
                            successNotification: {
                                description: 'Thành công',
                                message: `Kiểm tra email của bạn, bấm vào đường link để tiếp tục đăng ký`,
                            },
                        };
                    })
                    .catch((error: AxiosError<ProblemDetails>) => {
                        const resultResponse = {
                            success: false,
                            error: {
                                name: 'Thất bại',
                                message:
                                    'Đăng nhập thất bại, kiểm tra lại email của bạn và thử lại sau',
                            },
                        };

                        if (error.response?.data?.errors) {
                            const errors = error.response.data.errors;

                            if (errors['email']) {
                                const err = errors['email'] as string;
                                switch (err) {
                                    case 'notFound': {
                                        resultResponse.error.message =
                                            'Your email is not registered, please register first';
                                        break;
                                    }
                                    default: {
                                        resultResponse.error.message = error.response?.data?.detail;
                                        break;
                                    }
                                }
                            }
                        }

                        return resultResponse;
                    });
            } else {
                const loginData = data as LoginAction;
                const { hash, provider = null, to = '/' } = loginData;

                if (provider === 'google') {
                    signIn('google', {
                        callbackUrl: to ? to.toString() : '/',
                        redirect: true,
                    });

                    return {
                        success: true,
                        redirectTo: to ? to.toString() : '/',
                    };
                }

                try {
                    await signIn('credentials', {
                        hash,
                    });
                    return {
                        success: true,
                        redirectTo: to ? to.toString() : '/',
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: {
                            name: 'Đăng nhập thất bại',
                            message:
                                'Đăng nhập thất bại, kiểm tra lại email của bạn và thử lại sau',
                        },
                    };
                }
            }
        },
        register: async ({ type, ...data }: RegisterActionPayload) => {
            if (type === 'request-register') {
                const loginData = data as RequestRegisterAction;
                const { email, fullName = undefined, returnUrl } = loginData;
                const path = `${baseUrl}/auth/register`;

                return _axios
                    .post<void>(path, { email, fullName, returnUrl })
                    .then(() => {
                        return {
                            success: true,
                            redirectTo: '/',
                            successNotification: {
                                description: 'Thành công',
                                message: `Kiểm tra email của bạn, bấm vào đường link để tiếp tục đăng ký`,
                            },
                        };
                    })
                    .catch((error) => {
                        const resultResponse = {
                            success: false,
                            error: {
                                name: 'RegisterError',
                                message: 'Something went wrong, please try again',
                            },
                        };

                        if (error.response?.data?.errors) {
                            const errors = error.response.data.errors;

                            if (errors['email']) {
                                const err = errors['email'] as string;
                                switch (err) {
                                    case 'emailAlreadyExists': {
                                        resultResponse.error.message =
                                            'Your email is already registered, back to login';
                                        break;
                                    }
                                    default: {
                                        resultResponse.error.message = error.response?.data?.detail;
                                        break;
                                    }
                                }
                            }
                        }

                        return resultResponse;
                    });
            } else {
                const path = `${baseUrl}/auth/register/confirm`;
                const registerData = data as RegisterAction;
                const { hash } = registerData;

                return _axios
                    .post<void>(path, { hash })
                    .then(() => {
                        return {
                            success: true,
                            redirectTo: RouteNameEnum.LOGIN_PAGE,
                            successNotification: {
                                message: 'You have successfully registered',
                                description: 'Back to login and continue to VePhim',
                            },
                        };
                    })
                    .catch((error) => {
                        const resultResponse = {
                            success: false,
                            error: {
                                name: 'RegisterError',
                                message: 'Something went wrong, please try again',
                            },
                        };

                        if (error.response?.data?.errors) {
                            const errors = error.response.data.errors;

                            if (errors['hash']) {
                                const err = errors['hash'] as string;
                                switch (err) {
                                    case 'invalidHash': {
                                        resultResponse.error.message =
                                            'Your confirmation link is expired or invalid';
                                        break;
                                    }
                                    default: {
                                        resultResponse.error.message = error.response?.data?.detail;
                                        break;
                                    }
                                }
                            } else if (errors['user']) {
                                const err = errors['user'] as string;
                                switch (err) {
                                    case 'alreadyConfirmed': {
                                        resultResponse.error.message =
                                            'Your email is already confirmed, back to login';
                                        break;
                                    }
                                    case 'userNotFound': {
                                        resultResponse.error.message =
                                            'Your email is not registered, please register first';
                                        break;
                                    }
                                    default: {
                                        resultResponse.error.message = error.response?.data?.detail;
                                        break;
                                    }
                                }
                            } else {
                                resultResponse.error.message = error.response?.data?.detail;
                            }
                        }

                        return resultResponse;
                    });
            }
        },
        logout: async () => {
            await signOut();
            return {
                success: true,
                redirectTo: '/',
            };
        },
        check: async () => {
            const auth = await getSession();
            if (auth) {
                return {
                    authenticated: true,
                };
            }

            return {
                authenticated: false,
            };
        },
        getIdentity: async () => {
            const auth = await getSession();
            if (auth?.user) {
                const { refreshToken, accessToken, ...user } = auth.user as LoginResponseDto;
                const {
                    data: { data: res },
                } = await authAxios.post<any>(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
                    query: print(GET_ME_QUERY),
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                const getMe = res?.['getMe'];
                if (getMe) {
                    return { ...user, ...getMe };
                }
                return user;
            }
            return null;
        },
        onError: async (error) => {
            if (error.response?.status === 401) {
                return {
                    logout: true,
                };
            }

            return { error };
        },
    };
};
