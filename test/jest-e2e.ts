module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '../',
    modulePathIgnorePatterns: ['<rootDir>/dist'],
    testEnvironment: 'node',
    testRegex: '.e2e-spec.ts$',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleNameMapper: {
        '^~utils/(.*)$': '<rootDir>/src/utils/$1',
        '^~/(.*)$': '<rootDir>/src/$1',
        '^~root/(.*)$': '<rootDir>/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
