import { join } from 'node:path';
import { MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { AllConfig } from '../../../app/config';
import { TTransport } from './types/mailer.type';
import { GMAIL_TRANSPORT, RESEND_TRANSPORT, SENDGRID_TRANSPORT } from './mail.constant';
import { isNullOrUndefined } from '../../utils/common';

@Injectable()
export class MailerConfig implements MailerOptionsFactory {
    constructor(
        private readonly configService: ConfigService<AllConfig>,
        private readonly logger: PinoLogger,
    ) {}

    private readonly DEFAULT_SENDER = this.configService.get('mail.sender', {
        infer: true,
    });

    public get MailTransport(): { name: string; config: TTransport }[] {
        const transporters: { name: string; config: TTransport }[] = [];
        if (!isNullOrUndefined(this.configService.get('mail.sendgridPassword', { infer: true }))) {
            transporters.push({
                name: SENDGRID_TRANSPORT,
                config: {
                    host:
                        this.configService.get('mail.sendgridHost', { infer: true }) ??
                        'smtp.sendgrid.net',
                    auth: {
                        user:
                            this.configService.get('mail.sendgridUser', { infer: true }) ??
                            'apikey',
                        pass: this.configService.getOrThrow('mail.sendgridPassword', {
                            infer: true,
                        }),
                    },
                    port: 2525,
                },
            });
        }

        if (!isNullOrUndefined(this.configService.get('mail.resendApiKey', { infer: true }))) {
            transporters.push({
                name: RESEND_TRANSPORT,
                config: {
                    host:
                        this.configService.get('mail.resendHost', { infer: true }) ??
                        'smtp.resend.com',
                    auth: {
                        user:
                            this.configService.get('mail.resendUser', { infer: true }) ?? 'resend',
                        pass: this.configService.getOrThrow('mail.resendApiKey', { infer: true }),
                    },
                    port: 2587,
                },
            });
        }

        if (!isNullOrUndefined(this.configService.get('mail.gmailPassword', { infer: true }))) {
            transporters.push({
                name: GMAIL_TRANSPORT,
                config: {
                    host:
                        this.configService.get('mail.gmailHost', { infer: true }) ??
                        'smtp.gmail.com',
                    auth: {
                        user: this.configService.getOrThrow('mail.gmailUser', { infer: true }),
                        pass: this.configService.getOrThrow('mail.gmailPassword', { infer: true }),
                    },
                },
            });
        }

        return transporters;
    }

    public buildMailerOptions(transport: TTransport) {
        return {
            transport,
            defaults: {
                from: this.DEFAULT_SENDER,
            },
            template: {
                dir: join(
                    __dirname,
                    this.configService.getOrThrow('app.isDebug', { infer: true })
                        ? `templates`
                        : `assets/mail/templates`,
                ),
                adapter: new HandlebarsAdapter(),
                options: {
                    strict: true,
                },
            },
        };
    }

    createMailerOptions() {
        if (this.MailTransport?.length === 0) {
            this.logger.warn(`No mailer transport configured. Mail will not be sent.`);
            return {};
        }

        return this.buildMailerOptions(this.MailTransport[0].config);
    }
}
