/* eslint-disable @typescript-eslint/no-explicit-any */
export async function deepResolvePromises(input: any): Promise<unknown> {
    if (input instanceof Promise) {
        return await input;
    }

    if (Array.isArray(input)) {
        return await Promise.all(input.map(deepResolvePromises));
    }

    if (input instanceof Date) {
        return input;
    }

    if (typeof input === 'object' && input !== null) {
        const keys = Object.keys(input);
        const resolvedObject: { [key: string]: any } = {};

        for (const key of keys) {
            let resolvedValue = await deepResolvePromises(input[key]);

            // Special case for ObjectId
            if (resolvedValue && typeof resolvedValue === 'object' && 'buffer' in resolvedValue) {
                const buffer = Buffer.from(Object.values(resolvedValue.buffer as any) as any[]);
                resolvedValue = buffer.toString('hex');
            }

            resolvedObject[key] = resolvedValue;
        }

        return resolvedObject;
    }

    return input;
}
