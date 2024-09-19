import { registerAs } from '@nestjs/config';

import { IsEmail, IsOptional, IsString } from 'class-validator';
import validateConfig from '../../../libs/utils/validate-config';
import { AuthConfig } from './auth-config.type';

class EnvironmentVariablesValidator {
    @IsOptional()
    @IsEmail()
    ADMIN_EMAIL?: string;

    @IsOptional()
    @IsString()
    FORCE_ADMIN_EMAIL?: string;

    @IsString()
    AUTH_JWT_TOKEN_EXPIRES_IN: string;

    @IsString()
    AUTH_JWT_SECRET: string;

    @IsString()
    AUTH_REFRESH_TOKEN_EXPIRES_IN: string;

    @IsString()
    AUTH_REFRESH_SECRET: string;

    @IsString()
    AUTH_PASSWORDLESS_EXPIRES_IN: string;

    @IsString()
    AUTH_PASSWORDLESS_SECRET: string;

    @IsString()
    AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN: string;

    @IsString()
    AUTH_CONFIRM_EMAIL_SECRET: string;

    @IsString()
    AUTH_GOOGLE_ID: string;

    @IsString()
    AUTH_GOOGLE_SECRET: string;

    @IsString()
    AUTH_OTP_SECRET: string;
}

export default registerAs<AuthConfig>('auth', () => {
    validateConfig(process.env, EnvironmentVariablesValidator);

    return {
        adminEmail: process.env?.ADMIN_EMAIL ?? '',
        forceAdminEmail: process.env.FORCE_ADMIN_EMAIL === 'true',
        jwtTokenExpiresIn: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
        jwtSecret: process.env.AUTH_JWT_SECRET,
        refreshTokenExpiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
        refreshSecret: process.env.AUTH_REFRESH_SECRET,
        passwordlessExpiresIn: process.env.AUTH_PASSWORDLESS_EXPIRES_IN,
        passwordlessSecret: process.env.AUTH_PASSWORDLESS_SECRET,
        confirmEmailTokenExpiresIn: process.env.AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN,
        confirmEmailSecret: process.env.AUTH_CONFIRM_EMAIL_SECRET,
        googleId: process.env.AUTH_GOOGLE_ID,
        googleSecret: process.env.AUTH_GOOGLE_SECRET,
        otpSecret: process.env.AUTH_OTP_SECRET,
    };
});
