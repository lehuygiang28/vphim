import { ConfigService } from '@nestjs/config';
import { Condition, ObjectId, Types, isValidObjectId } from 'mongoose';
import { removeTone, removeDiacritics } from '@vn-utils/text';
import slug from 'slugify';

/**
 * Checks if the environment is production
 * @returns true if the environment is production
 */
export function isProduction(configService?: ConfigService) {
    if (!configService) {
        return process.env?.NODE_ENV?.toLowerCase() === 'production';
    }

    return configService.get('NODE_ENV')?.toLowerCase() === 'production';
}

/**
 *
 * @param stringValue The string value to check if it is true
 * @returns true if the string value is true, otherwise false
 * @description true value: true
 */
export function isTrue(stringValue?: string | boolean): boolean {
    if (!stringValue) {
        return false;
    }
    return typeof stringValue === 'boolean'
        ? stringValue
        : stringValue?.toLowerCase()?.trim() === 'true';
}

export function convertToObjectId(
    input: string | Types.ObjectId | Uint8Array | number | Condition<ObjectId>,
): Types.ObjectId {
    if (!isValidObjectId(input)) {
        throw new Error(`Invalid object id: ${input}`);
    }
    return new Types.ObjectId(input);
}

/**
 * Removes all trailing slashes from a path
 * @param path The path to remove trailing slashes
 * @returns The path without any trailing slashes
 */
export function removeTrailingSlash(path: string) {
    return path.replace(/\/+$/, '');
}

/**
 * Removes all leading slashes from a path
 * @param path The path to remove leading slashes
 * @returns The path without any leading slashes
 */
export function removeLeadingSlash(path: string) {
    return path.replace(/^\/+/, '');
}

/**
 * Removes all trailing and leading slashes from a path
 * @param path The path to remove trailing and leading slashes
 * @returns The path without any trailing or leading slashes
 */
export function removeLeadingAndTrailingSlashes(path: string) {
    return removeLeadingSlash(removeTrailingSlash(path));
}

export function resolveUrl(path: string, host?: string) {
    if (path.startsWith('http')) {
        return path;
    }

    if (host && path) {
        return `${removeLeadingAndTrailingSlashes(host)}/${removeLeadingAndTrailingSlashes(path)}`;
    }

    return path || null;
}

/**
 *
 * @param value The value to check if it is null or undefined
 * @returns true if the value is null or undefined, otherwise false
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
    return value === null || value === undefined;
}

/**
 * Creates a promise that resolves after a specified amount of time.
 *
 * @param {number} ms - The time in milliseconds to wait before resolving the promise.
 * @return {Promise<void>} A promise that resolves after the specified time.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sorts and stringifies an argument
 * @param arg The argument to be sorted and stringified
 * @returns The sorted and stringified argument as a string
 */
export function sortedStringify(arg: unknown): string {
    if (typeof arg !== 'object' || arg === null || arg === undefined) {
        return JSON.stringify(arg);
    }

    if (Array.isArray(arg)) {
        return '[' + arg.map(sortedStringify).join(',') + ']';
    }

    const keys = Object.keys(arg as object).sort((a, b) => a.localeCompare(b));
    const keyValuePairs = keys.map((key) => {
        const value = sortedStringify((arg as { [key: string]: unknown })[key]);
        return '"' + key + '":' + value;
    });
    return '{' + keyValuePairs.join(',') + '}';
}

export function randomString(length: number, { onlyLetters = false } = {}): string {
    let result = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const characters = onlyLetters ? letters : letters + '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export const slugifyVietnamese = (str: string, options?: Parameters<typeof slug>[1]) => {
    return slug(removeDiacritics(removeTone(str)), options);
};

export function isEmptyObject(obj: object): boolean {
    return Object.keys(obj)?.length === 0;
}

export function extractJSON(text: string): object {
    try {
        // Find the first opening brace '{' and the last closing brace '}'
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        // Ensure both braces are found and extract the content between them
        if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
            text = text.substring(startIndex, endIndex + 1);
        } else {
            // If braces are not found or invalid, log an error and return an empty object
            this.logger.error('Failed to locate a valid JSON object in the response');
            return {};
        }

        // Return the cleaned JSON string
        return JSON.parse(text.trim());
    } catch (error) {
        return {};
    }
}
