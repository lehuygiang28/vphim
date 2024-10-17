import type { AuthValidatePasswordlessDto } from 'apps/api/src/app/auth/dtos/auth-login-validate-pwd-less.dto';

export type LoginAction = AuthValidatePasswordlessDto & {
    type: 'login';
    provider: null | 'google' | 'github';
    to: null | string;
};

export type RequestLoginAction = {
    type: 'request-login';
    email: string;
    returnUrl: string;
};

export type LoginActionPayload = LoginAction | RequestLoginAction;
