import * as smtpTransport from 'nodemailer/lib/smtp-transport';

export type TTransport = {
    host: string;
    secure?: boolean;
    auth: {
        user: string;
        pass: string;
    };
} & smtpTransport.Options;
