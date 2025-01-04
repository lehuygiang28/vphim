'use server';

import { cookies } from 'next/headers';
import { Locale, defaultLocale, locales } from '~mnt/i18n/config';

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale() {
    const supportedLocales = new Set(locales);
    const userLocale = cookies().get(COOKIE_NAME)?.value;
    return supportedLocales.has(userLocale as Locale) ? userLocale : defaultLocale;
}

export async function setUserLocale(locale: Locale | string) {
    cookies().set(COOKIE_NAME, locale);
}
