import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { MailService } from './mail.service';
import { MailerConfig } from './mail.config';
import { I18nModule } from '../i18n';
import { MailProcessor } from './mail.processor';
import mailConfig from './config/mail-config';

@Module({
    imports: [
        ConfigModule.forFeature(mailConfig),
        I18nModule,
        MailerModule.forRootAsync({
            useClass: MailerConfig,
        }),
    ],
    providers: [MailService, MailerConfig, MailProcessor],
    exports: [MailService],
})
export class MailModule {}
