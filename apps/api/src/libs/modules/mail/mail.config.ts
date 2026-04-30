import { join } from 'node:path';
import { MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { AllConfig } from '../../../app/config';
import { TTransport } from './types/mailer.type';
import { GMAIL_TRANSPORT, RESEND_TRANSPORT, SENDGRID_TRANSPORT } from './mail.constant';

@Injectable()
export class MailerConfig implements MailerOptionsFactory {
    constructor(
        private readonly configService: ConfigService<AllConfig>,
        private readonly logger: PinoLogger,
    ) {}

    private readonly DEFAULT_SENDER = this.configService.get('mail.sender', {
        infer: true,
    });

    private isNonEmptyString(value: unknown): value is string {
        return typeof value === 'string' && value.trim().length > 0;
    }

    public get MailTransport(): { name: string; config: TTransport }[] {
        const transporters: { name: string; config: TTransport }[] = [];
        const sendgridPassword = this.configService.get('mail.sendgridPassword', { infer: true });
        if (this.isNonEmptyString(sendgridPassword)) {
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
                        pass: sendgridPassword,
                    },
                    port: 2525,
                },
            });
        }

        const resendApiKey = this.configService.get('mail.resendApiKey', { infer: true });
        if (this.isNonEmptyString(resendApiKey)) {
            transporters.push({
                name: RESEND_TRANSPORT,
                config: {
                    host:
                        this.configService.get('mail.resendHost', { infer: true }) ??
                        'smtp.resend.com',
                    auth: {
                        user:
                            this.configService.get('mail.resendUser', { infer: true }) ?? 'resend',
                        pass: resendApiKey,
                    },
                    port: 2587,
                },
            });
        }

        const gmailUser = this.configService.get('mail.gmailUser', { infer: true });
        const gmailPassword = this.configService.get('mail.gmailPassword', { infer: true });
        if (this.isNonEmptyString(gmailUser) && this.isNonEmptyString(gmailPassword)) {
            transporters.push({
                name: GMAIL_TRANSPORT,
                config: {
                    host:
                        this.configService.get('mail.gmailHost', { infer: true }) ??
                        'smtp.gmail.com',
                    auth: {
                        user: gmailUser,
                        pass: gmailPassword,
                    },
                },
            });
        }

        return transporters;
    }

    public buildMailerOptions(transport: TTransport) {
        const defaultSender = this.isNonEmptyString(this.DEFAULT_SENDER) ? this.DEFAULT_SENDER : 'VePhim';
        return {
            transport,
            defaults: {
                from: defaultSender,
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
