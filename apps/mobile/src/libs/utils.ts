/* eslint-disable @typescript-eslint/no-explicit-any */
export function filterConsoleWarnings() {
    const ignoreLogTextList = [
        'Warning: findNodeHandle is deprecated in StrictMode.',
        'Warning: findHostInstance_DEPRECATED is deprecated in StrictMode.',
    ];

    const connectConsoleTextFromArgs = (arrayOfStrings: string[]): string =>
        arrayOfStrings
            .slice(1)
            .reduce(
                (baseString, currentString) => baseString.replace('%s', currentString),
                arrayOfStrings[0],
            );

    const filterIgnoredMessages =
        (logger: any): ((...args: any[]) => void) =>
        (...args): void => {
            const output = connectConsoleTextFromArgs(args);

            if (!ignoreLogTextList.some((log) => output.includes(log))) {
                logger(...args);
            }
        };

    console.log = filterIgnoredMessages(console.log);
    console.info = filterIgnoredMessages(console.info);
    console.warn = filterIgnoredMessages(console.warn);
    console.error = filterIgnoredMessages(console.error);
}

// remove the props.style property from the object
// fix err
// fix the type return must not have style property
export function removeStyleProperty<T extends Record<string, any>>(
    props: T | undefined,
): Omit<T, 'style'> | undefined {
    if (!props) return undefined;
    const { style, ...rest } = props;
    return rest;
}

/**
 * Sort a list of objects by name, putting numbers last and in numerical order.
 * Non-numerical strings are sorted alphabetically.
 * @param _a First object to compare
 * @param _b Second object to compare
 * @returns A negative number if _a should come first, a positive number if _b should come first, or 0 if they are equal.
 */
export function sortAlphabetNumberLast(_a: { name: string }, _b: { name: string }): number {
    const a = _a.name;
    const b = _b.name;
    try {
        const isANumber = !isNaN(Number(a));
        const isBNumber = !isNaN(Number(b));

        // If both are numbers, sort numerically
        if (isANumber && isBNumber) {
            return Number(a) - Number(b);
        }

        // If only one is a number, it should come last
        if (isANumber) return 1;
        if (isBNumber) return -1;
    } catch (error) {
        // If either is not a number, sort alphabetically
    }

    // If neither are numbers, sort alphabetically
    return String(a).localeCompare(String(b));
}
