module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    moduleNameMapper: {
        '^~utils/(.*)$': '<rootDir>/src/utils/$1',
        '^~/(.*)$': '<rootDir>/src/$1',
        '^~root/(.*)$': '<rootDir>//$1',
    },
    modulePathIgnorePatterns: ['<rootDir>/dist'],
    testEnvironment: 'node',
    /**
     * Chạy các file setup trước khi chạy các test case.
     */
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
