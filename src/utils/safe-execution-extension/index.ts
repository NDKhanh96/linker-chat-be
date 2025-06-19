Function.prototype.toSafe = function <T>(this: (...args: unknown[]) => T, ...args: unknown[]): [Error, null] | [null, T] {
    try {
        const result: T = this(...args);

        if (result instanceof Promise) {
            throw new Error('Only sync function are supported in toSafe');
        }

        return [null, result];
    } catch (error: unknown) {
        const err: Error = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));

        return [err, null];
    }
};

Function.prototype.toSafeAsync = async function <T>(this: (...args: unknown[]) => T, ...args: unknown[]): Promise<[Error, null] | [null, Awaited<T>]> {
    try {
        const result: T = this(...args);

        if (!(result instanceof Promise)) {
            throw new Error('Only promises are supported in toSafeAsync');
        }
        const data: Awaited<T> = await result;

        return [null, data];
    } catch (error: unknown) {
        const err: Error = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));

        return [err, null];
    }
};

Promise.prototype.toSafe = async function <T>(this: Promise<T>): Promise<[Error, null] | [null, T]> {
    try {
        const result: T = await this;

        return [null, result];
    } catch (error: unknown) {
        const err: Error = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));

        return [err, null];
    }
};
