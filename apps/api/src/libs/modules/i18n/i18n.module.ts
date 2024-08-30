import { join } from 'node:path';
import { Module } from '@nestjs/common';
import {
    I18nModule as I18nModuleCore,
    AcceptLanguageResolver,
    HeaderResolver,
    I18nContext,
} from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';

import { AllConfig } from '../../../app/config';

@Module({
    imports: [
        I18nModuleCore.forRootAsync({
            useFactory: (configService: ConfigService<AllConfig>) => ({
                fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', { infer: true }),
                loaderOptions: {
                    path: join(
                        __dirname,
                        configService.getOrThrow('app.isDebug', { infer: true })
                            ? './lang/'
                            : './assets/i18n/lang/',
                    ),
                    watch: true,
                },
                typesOutputPath: configService.getOrThrow('app.isDebug', { infer: true })
                    ? undefined
                    : join(process.cwd(), `./apps/api/src/libs/modules/i18n/i18n.generated.ts`),
            }),
            resolvers: [
                new HeaderResolver(['x-lang', 'x-language', 'language']),
                AcceptLanguageResolver, // must be the last one
            ],
            inject: [ConfigService],
        }),
    ],
    providers: [I18nContext],
    exports: [I18nContext],
})
export class I18nModule {}
