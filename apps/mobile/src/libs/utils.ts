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
