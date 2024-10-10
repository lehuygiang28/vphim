import RelativeTimeFormat, { LocaleMatcher, Numeric, Style } from 'relative-time-format';
import vi from 'relative-time-format/locale/vi';

// Add Vietnamese locale
RelativeTimeFormat.addLocale(vi);

type TimeUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

interface RelativeDateOptions {
    style?: Style;
    numeric?: Numeric;
    localeMatcher?: LocaleMatcher;
    locale?: string;
}

const DIVISIONS: [number, TimeUnit][] = [
    [60 * 60 * 24 * 365, 'year'],
    [60 * 60 * 24 * 30, 'month'],
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
    [1, 'second'],
];

export const relativeDate = (
    date: Date | number | string,
    options: RelativeDateOptions = {},
): string => {
    const { style = 'long', numeric = 'auto', localeMatcher = 'best fit', locale = 'vi' } = options;

    const formatter = new RelativeTimeFormat(locale, {
        style,
        numeric,
        localeMatcher,
    });

    const now = Date.now();
    const timestamp = typeof date === 'object' ? date.getTime() : new Date(date).getTime();
    const elapsed = (timestamp - now) / 1000;

    for (const [divisor, unit] of DIVISIONS) {
        if (Math.abs(elapsed) >= divisor || unit === 'second') {
            const value = Math.round(elapsed / divisor);
            return formatter.format(value, unit);
        }
    }

    return formatter.format(0, 'second');
};

export default relativeDate;
