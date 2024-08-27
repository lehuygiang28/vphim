import { type AppConfig } from './app-config.type';
import { type AuthConfig } from '../auth/config';
import { type MailConfig } from '../../libs/modules/mail/config';

export type AllConfig = {
    app: AppConfig;
    auth: AuthConfig;
    mail: MailConfig;
};
