import { ConfigService } from '@nestjs/config';
import { Condition, ObjectId, Types, isValidObjectId } from 'mongoose';
import { createHash } from 'node:crypto';

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
export function isTrue(stringValue: string | boolean): boolean {
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

export function getGravatarUrl(email: string, size = 500, defaultImage = 'mp', rating = 'g') {
    const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
    return `https://gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}&r=${rating}`;
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
