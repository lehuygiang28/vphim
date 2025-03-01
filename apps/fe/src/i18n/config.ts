export type Locale = (typeof locales)[number];

export const locales = ['vi', 'en'] as const;
export const defaultLocale: Locale = 'vi';
