Function.prototype.toSafe = function <T>(this: (...args: unknown[]) => T, ...args: unknown[]): [Error, null] | [null, T] {
    try {
        const result: T = this(...args);

        return [null, result];
    } catch (error: unknown) {
        if (error instanceof Error) {
            return [error, null];
        }

        const err = new Error(typeof error === 'string' ? error : JSON.stringify(error));

        return [err, null];
    }
};

Promise.prototype.toSafe = async function <T>(this: Promise<T>): Promise<[Error, null] | [null, T]> {
    try {
        const result: T = await this;

        return [null, result];
    } catch (error: unknown) {
        if (error instanceof Error) {
            return [error, null];
        }

        const err = new Error(typeof error === 'string' ? error : JSON.stringify(error));

        return [err, null];
    }
};
