import { registerAs } from '@nestjs/config';
import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

import validateConfig from '../../libs/utils/validate-config';
import { removeLeadingAndTrailingSlashes } from '../../libs/utils/common';

import { AppConfig } from './app-config.type';

class EnvironmentVariablesValidator {
    @IsOptional()
    @IsString()
    GLOBAL_PREFIX: string;

    @IsOptional()
    @IsString()
    FE_DOMAIN: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    PORT: number;

    @IsOptional()
    @IsString()
    FALLBACK_LANGUAGE: string;

    @IsOptional()
    @IsString()
    API_STATS_PATH: string;

    @ValidateIf((o: EnvironmentVariablesValidator) => !!o?.API_STATS_PATH)
    @IsString()
    API_STATS_USERNAME: string;

    @ValidateIf((o: EnvironmentVariablesValidator) => !!o?.API_STATS_PATH)
    @IsString()
    API_STATS_PASSWORD: string;
}

export default registerAs<AppConfig>('app', () => {
    validateConfig(process.env, EnvironmentVariablesValidator);

    return {
        globalPrefix: process.env?.GLOBAL_PREFIX
            ? removeLeadingAndTrailingSlashes(process.env.GLOBAL_PREFIX)
            : 'api',
        feDomain: process.env?.FE_DOMAIN
            ? removeLeadingAndTrailingSlashes(process.env.FE_DOMAIN)
            : 'https://tasktr.vercel.app',
        port: process.env?.PORT ? parseInt(process.env?.PORT, 10) : 8000,
        fallbackLanguage: process.env?.FALLBACK_LANGUAGE || 'en',
        apiStatsPath: process.env?.API_STATS_PATH
            ? removeLeadingAndTrailingSlashes(process.env.API_STATS_PATH)
            : '',
        apiStatsUsername: process.env?.API_STATS_USERNAME,
        apiStatsPassword: process.env?.API_STATS_PASSWORD,
    } satisfies AppConfig;
});
