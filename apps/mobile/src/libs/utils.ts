/* eslint-disable @typescript-eslint/no-explicit-any */
export function ignoreExpoWaring() {
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
