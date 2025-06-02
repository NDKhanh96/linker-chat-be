type CompareFn = (password: string, hashedPassword: string) => Promise<boolean>;
type GenSaltFn = () => Promise<string>;
type HashFn = (password: string, salt: string) => Promise<string>;

export const compare: CompareFn = jest.fn().mockImplementation((password: string, hashedPassword: string = '123456') => {
    return Promise.resolve(password === hashedPassword);
});

export const genSalt: GenSaltFn = jest.fn().mockResolvedValue('salt');

export const hash: HashFn = jest.fn().mockImplementation((password: string, salt: string) => {
    if (password === '123456' && salt === 'salt') {
        return Promise.resolve('$2b$10$BfpEs7RkIxOV5aZlcdKj5egaGEVKbNaUU7c1JBVbzxGCkBaO9E6lW');
    }

    return Promise.resolve('');
});
