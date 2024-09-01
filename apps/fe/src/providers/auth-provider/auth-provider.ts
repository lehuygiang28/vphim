'use client';

import { AuthProvider } from '@refinedev/core';
import { signIn, getSession, signOut } from 'next-auth/react';
import { AxiosError } from 'axios';
import axios from '@/libs/axios';

import { type ProblemDetails } from 'apps/api/src/libs/dtos';
import { LoginResponseDto } from 'apps/api/src/app/auth/dtos';

import type { LoginActionPayload, LoginAction, RequestLoginAction } from './types/login.type';
import {
    RegisterAction,
    RegisterActionPayload,
    RequestRegisterAction,
} from './types/register.type';

export const authProvider: AuthProvider = {
    login: async ({ type, ...data }: LoginActionPayload) => {
        if (type === 'request-login') {
            const path = '/auth/login/pwdless';
            const requestData = data as RequestLoginAction;

            return axios
                .post<void>(path, requestData)
                .then(() => {
                    return {
                        success: true,
                        redirectTo: '/login',
                        successNotification: {
                            description: 'Check your email',
                            message: `We've sent you an email with a link to log in. Click the link to continue.`,
                        },
                    };
                })
                .catch((error: AxiosError<ProblemDetails>) => {
                    const resultResponse = {
                        success: false,
                        error: {
                            name: 'LoginError',
                            message: 'Something went wrong, please try again',
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
                    redirectTo: to ? to.toString() : '/tasks',
                };
            } catch (error) {
                return {
                    success: false,
                    error: {
                        name: 'LoginError',
                        message: 'Invalid email, please try again',
                    },
                };
            }
        }
    },
    register: async ({ type, ...data }: RegisterActionPayload) => {
        if (type === 'request-register') {
            const loginData = data as RequestRegisterAction;
            const { email, fullName = undefined, returnUrl } = loginData;
            const path = '/auth/register';

            return axios
                .post<void>(path, { email, fullName, returnUrl })
                .then(() => {
                    return {
                        success: true,
                        redirectTo: '/register',
                        successNotification: {
                            description: 'Check your email',
                            message: `We've sent you an email with a link to register. Click the link to continue.`,
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
            const path = '/auth/register/confirm';
            const registerData = data as RegisterAction;
            const { hash } = registerData;

            return axios
                .post<void>(path, { hash })
                .then(() => {
                    return {
                        success: true,
                        redirectTo: '/login',
                        successNotification: {
                            message: 'You have successfully registered',
                            description: 'Back to login and continue to TaskTr',
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
