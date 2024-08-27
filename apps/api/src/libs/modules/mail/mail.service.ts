import { Injectable } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { I18nService } from 'nestjs-i18n';
import { PinoLogger } from 'nestjs-pino';
import { Attachment } from 'nodemailer/lib/mailer';

import { MaybeType } from '../../types';
import { I18nTranslations } from '../i18n';
import { MailerConfig } from './mail.config';
import { SENDGRID_TRANSPORT } from './mail.constant';

@Injectable()
export class MailService {
    private readonly TRANSPORTERS: string[] = [];
    private readonly MAX_RETRIES: number = 0;
    private readonly BASE_ATTACHMENT: Attachment[] = [];

    constructor(
        private readonly mailerService: MailerService,
        private readonly logger: PinoLogger,
        private readonly i18n: I18nService<I18nTranslations>,
        private readonly mailConfig: MailerConfig,
    ) {
        for (const transporter of this.mailConfig.MailTransport) {
            this.TRANSPORTERS.push(transporter.name);
            this.mailerService.addTransporter(transporter.name, transporter.config);
        }
        this.MAX_RETRIES = this.mailConfig.MailTransport.length;

        this.logger.setContext(MailService.name);
    }

    private resolveTransporter(transporter = SENDGRID_TRANSPORT) {
        return this.TRANSPORTERS.includes(transporter) ? transporter : SENDGRID_TRANSPORT;
    }

    private getNextTransporter(currentTransporter: string): string {
        const currentIndex = this.TRANSPORTERS.indexOf(currentTransporter);
        return currentIndex === -1 || currentIndex === this.TRANSPORTERS.length - 1
            ? this.TRANSPORTERS[0]
            : this.TRANSPORTERS[currentIndex + 1];
    }

    private async sendMailWithRetry(
        mailData: ISendMailOptions,
        retryCount = 0,
        transporter = SENDGRID_TRANSPORT,
    ): Promise<unknown> {
        if (retryCount > this.MAX_RETRIES) {
            this.logger.debug(`Send mail failed: too many retries`);
            return { message: 'Failed to send email' };
        }

        const transporterName = this.resolveTransporter(transporter);
        this.logger.debug(`Sending mail to ${mailData.to} with transporter: ${transporterName}`);

        try {
            await this.mailerService.sendMail({
                ...mailData,
                transporterName,
                attachments: this.BASE_ATTACHMENT,
            });
            this.logger.info(`Mail sent: ${mailData.to}`);
        } catch (error) {
            this.logger.error(`Send mail failed: ${(error as Error)?.message}`);
            const nextTransporter = this.getNextTransporter(transporterName);
            this.logger.debug(`Retry send mail with transporter: ${nextTransporter}`);
            await this.sendMailWithRetry(mailData, retryCount + 1, nextTransporter);
        }

        return { message: `Email sent to ${mailData.to}` };
    }

    async sendConfirmMail(data: { to: string; mailData: { url: string }; isResend?: boolean }) {
        const { to, isResend = false, mailData } = data;
        const template = 'confirm-email';

        const titleKey = isResend
            ? 'mail-context.RESEND_CONFIRM_EMAIL.title'
            : 'mail-context.CONFIRM_EMAIL.title';
        const text1Key = isResend
            ? 'mail-context.RESEND_CONFIRM_EMAIL.text1'
            : 'mail-context.CONFIRM_EMAIL.text1';
        const text2Key = isResend
            ? 'mail-context.RESEND_CONFIRM_EMAIL.text2'
            : 'mail-context.CONFIRM_EMAIL.text2';
        const text3Key = isResend
            ? 'mail-context.RESEND_CONFIRM_EMAIL.text3'
            : 'mail-context.CONFIRM_EMAIL.text3';
        const btn1Key = isResend
            ? 'mail-context.RESEND_CONFIRM_EMAIL.btn1'
            : 'mail-context.CONFIRM_EMAIL.btn1';

        const [title, text1, text2, text3, btn1]: MaybeType<string>[] = await Promise.all([
            this.i18n.t(titleKey),
            this.i18n.t(text1Key),
            this.i18n.t(text2Key),
            this.i18n.t(text3Key),
            this.i18n.t(btn1Key),
        ]);

        await this.sendMailWithRetry({
            to,
            subject: title,
            template,
            context: { title, url: mailData.url.toString(), text1, text2, text3, btn1 },
        });
    }

    async sendForgotPassword(mailData: {
        to: string;
        data: { url: string; tokenExpires: number; returnUrl?: string };
    }) {
        const { to, data } = mailData;
        const template = 'reset-password';

        const [resetPasswordTitle, text1, text2, text3, btn1]: MaybeType<string>[] =
            await Promise.all([
                this.i18n.t('mail-context.RESET_PASSWORD.title'),
                this.i18n.t('mail-context.RESET_PASSWORD.text1'),
                this.i18n.t('mail-context.RESET_PASSWORD.text2'),
                this.i18n.t('mail-context.RESET_PASSWORD.text3'),
                this.i18n.t('mail-context.RESET_PASSWORD.btn1'),
            ]);

        const url = new URL(data.url);
        url.searchParams.set('expires', data.tokenExpires.toString());

        await this.sendMailWithRetry({
            to,
            subject: resetPasswordTitle,
            template,
            context: { title: resetPasswordTitle, url: url.toString(), text1, text2, text3, btn1 },
        });
    }

    async sendLogin(data: { to: string; mailData: { url: string } }) {
        const { to, mailData } = data;
        const template = 'login';

        const [emailConfirmTitle, text1, text2, text3, btn1]: MaybeType<string>[] =
            await Promise.all([
                this.i18n.t('mail-context.LOGIN_EMAIL.title'),
                this.i18n.t('mail-context.LOGIN_EMAIL.text1'),
                this.i18n.t('mail-context.LOGIN_EMAIL.text2'),
                this.i18n.t('mail-context.LOGIN_EMAIL.text3'),
                this.i18n.t('mail-context.LOGIN_EMAIL.btn1'),
            ]);

        await this.sendMailWithRetry({
            to,
            subject: emailConfirmTitle,
            template,
            context: { title: emailConfirmTitle, url: mailData.url, text1, text2, text3, btn1 },
        });
    }
}
