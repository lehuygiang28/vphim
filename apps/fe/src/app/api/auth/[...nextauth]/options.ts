import { Account, Session, User, AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { AxiosError } from 'axios';

import type { AuthValidatePasswordlessDto, LoginResponseDto } from 'apps/api/src/app/auth/dtos';

import { axiosInstance } from '@/libs/axios';
import { RouteNameEnum } from '@/constants/route.constant';

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        GithubProvider({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
        CredentialsProvider({
            credentials: {
                hash: {
                    label: 'hash',
                },
            },
            async authorize(credentials) {
                const path = '/api/auth/login/pwdless/validate';
                const payload: AuthValidatePasswordlessDto = {
                    hash: credentials?.hash || '',
                };

                return axiosInstance
                    .post<LoginResponseDto>(path, payload)
                    .then((response) => {
                        return { ...response.data, id: response.data._id.toString() };
                    })
                    .catch((err: AxiosError) => {
                        throw err;
                    });
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' },
    callbacks: {
        /**
         * Controls whether a user is allowed to sign in or not.
         *
         * Returning `true` continues the sign-in flow.
         * Returning `false` or throwing an error will stop the sign-in flow and redirect the user to the error page.
         * Returning `a string` will redirect the user to the specified URL.
         *
         * Throw error will return user with query `?error=<error_message>`
         * @see https://authjs.dev/reference/core#signin
         */
        async signIn({ user, account }: { user: User; account: Account | null }) {
            switch (account?.provider) {
                case 'credentials': {
                    return true;
                }
                case 'google': {
                    try {
                        const { data: userData } = await axiosInstance.post<LoginResponseDto>(
                            '/api/auth/login/google',
                            {
                                idToken: account.id_token,
                            },
                        );

                        Object.assign(user, {
                            ...userData,

                            //remove default properties of google
                            id: undefined,
                            name: undefined,
                            sub: undefined,
                            picture: undefined,
                            image: undefined,
                            iat: undefined,
                            exp: undefined,
                            jti: undefined,
                        });
                        return true;
                    } catch (error) {
                        console.error(error);
                        throw new Error('failed_to_login');
                    }
                }
                case 'github': {
                    try {
                        const { data: userData } = await axiosInstance.post<LoginResponseDto>(
                            `/api/auth/login/github`,
                            {
                                accessToken: account.access_token,
                            },
                        );

                        Object.assign(user, {
                            ...userData,

                            //remove default properties of github
                            id: undefined,
                            name: undefined,
                            sub: undefined,
                            picture: undefined,
                            image: undefined,
                            iat: undefined,
                            exp: undefined,
                            jti: undefined,
                        });
                        return true;
                    } catch (error) {
                        console.error(error);
                        throw new Error('failed_to_login');
                    }
                }
                default: {
                    throw new Error(`unknown_provider:${account?.provider}`);
                }
            }
        },
        /**
         * This callback is called whenever a JSON Web Token is created.
         * (i.e. at sign in) or updated (i.e whenever a session is accessed in the client).
         * Anything you return here will be saved in the JWT and forwarded to the session callback.
         * @see https://authjs.dev/reference/core#jwt
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token = { ...token, ...user };
            }
            if (trigger === 'update') {
                token = { ...token, ...session?.user };
            }
            return token;
        },
        /**
         * This callback is called whenever a session is checked.
         * (i.e. when invoking the /api/session endpoint, using useSession or getSession).
         * The return value will be exposed to the client, so be careful what you return here!
         * @see https://authjs.dev/reference/core#session
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: { session: Session; token: any }) {
            if (token) {
                session.user = token;
            }
            return session;
        },
        /**
         * This callback is called anytime the user is redirected to a callback URL
         * (i.e. on signin or signout)
         * By default only URLs on the same host as the origin are allowed.
         * You can use this callback to customise that behaviour.
         * @see https://authjs.dev/reference/core#redirect
         */
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            if (url.startsWith('/')) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    pages: {
        signIn: RouteNameEnum.LOGIN_PAGE,
        error: RouteNameEnum.LOGIN_PAGE,
    },
    logger: {
        debug: (...data: unknown[]) => console.debug({ ...data }),
        error: (...data: unknown[]) => console.error({ ...data }),
        warn: (...data: unknown[]) => console.warn({ ...data }),
    },
};
