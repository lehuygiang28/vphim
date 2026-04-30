import { ConfigService } from '@nestjs/config';

import type { AllConfig } from '../../../app/config';

export type MailCapability = {
    enabled: boolean;
    providers: {
        sendgrid: boolean;
        resend: boolean;
        gmail: boolean;
    };
};

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

export function getMailCapability(configService: ConfigService<AllConfig>): MailCapability {
    const sendgrid = isNonEmptyString(configService.get('mail.sendgridPassword', { infer: true }));
    const resend = isNonEmptyString(configService.get('mail.resendApiKey', { infer: true }));

    const gmailUser = configService.get('mail.gmailUser', { infer: true });
    const gmailPassword = configService.get('mail.gmailPassword', { infer: true });
    const gmail = isNonEmptyString(gmailUser) && isNonEmptyString(gmailPassword);

    return {
        enabled: sendgrid || resend || gmail,
        providers: { sendgrid, resend, gmail },
    };
}

