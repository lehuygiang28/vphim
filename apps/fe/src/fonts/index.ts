import { Open_Sans } from 'next/font/google';

export const customFont = Open_Sans({
    subsets: ['latin', 'vietnamese'],
    fallback: [
        'ui-sans-serif',
        'system-ui',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
    ],
});
