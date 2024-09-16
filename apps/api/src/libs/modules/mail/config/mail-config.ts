import { registerAs } from '@nestjs/config';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import validateConfig from '../../../utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
    @IsString()
    @IsNotEmpty()
    MAIL_SENDER: string;

    @IsOptional()
    @IsString()
    SENDGRID_HOST: string;

    @IsOptional()
    @IsString()
    SENDGRID_USER: string;

    @IsOptional()
    @IsString()
    SENDGRID_PASSWORD: string;

    @IsOptional()
    @IsString()
    GMAIL_HOST: string;

    @IsOptional()
    @IsString()
    GMAIL_USER: string;

    @IsOptional()
    @IsString()
    GMAIL_PASSWORD: string;

    @IsOptional()
    @IsString()
    RESEND_HOST: string;

    @IsOptional()
    @IsString()
    RESEND_USER: string;

    @IsOptional()
    @IsString()
    RESEND_API_KEY: string;
}

export default registerAs<MailConfig>('mail', () => {
    validateConfig(process.env, EnvironmentVariablesValidator);

    return {
        sender: process.env.MAIL_SENDER || 'VePhim',
        sendgridHost: process.env.SENDGRID_HOST || 'smtp.sendgrid.net',
        sendgridUser: process.env.SENDGRID_USER || 'apikey',
        sendgridPassword: process.env.SENDGRID_PASSWORD || '',

        gmailHost: process.env.GMAIL_HOST || 'smtp.gmail.com',
        gmailUser: process.env.GMAIL_USER || '',
        gmailPassword: process.env.GMAIL_PASSWORD || '',

        resendHost: process.env.RESEND_HOST || 'smtp.resend.com',
        resendUser: process.env.RESEND_USER || 'resend',
        resendApiKey: process.env.RESEND_API_KEY || '',
    };
});
