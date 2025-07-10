import type { RefreshToken, VerifyToken } from '~/auth/entities';
import type { User } from '~/user/entities';

export const mockUserInfo = {
    correctPassword: 'correctPassword',
};

export const mockDto = {
    register: {
        req: {
            newEmail: {
                firstName: 'john',
                lastName: 'doe',
                avatar: '',
                email: 'not_existed@gmail.com',
                password: '123456',
                confirmPassword: '123456',
                isCredential: true,
            },
            existedEmail: {
                firstName: 'john',
                lastName: 'doe',
                avatar: '',
                email: 'existed@gmail.com',
                password: '123456',
                confirmPassword: '123456',
                isCredential: true,
            },
        },
        res: {
            repository: {
                account: {
                    save: {
                        id: 19,
                        email: '20@gmail.com',
                        password: '$2b$10$BfpEs7RkIxOV5aZlcdKj5egaGEVKbNaUU7c1JBVbzxGCkBaO9E6lW',
                        enableAppMfa: false,
                        isCredential: false,
                        refreshToken: undefined,
                        verifyToken: undefined,
                        user: {
                            id: 19,
                            firstName: 'john',
                            lastName: 'doe',
                            avatar: '',
                            account: undefined,
                            email: '20@gmail.com',
                            password: '$2b$10$BfpEs7RkIxOV5aZlcdKj5egaGEVKbNaUU7c1JBVbzxGCkBaO9E6lW',
                            confirmPassword: '123456',
                            isCredential: false,
                        },
                        firstName: 'john',
                        lastName: 'doe',
                        avatar: '',
                        confirmPassword: '123456',
                    },
                },
            },
            service: {
                register: {
                    complete: {
                        id: 19,
                        email: '20@gmail.com',
                        enableAppMfa: false,
                        isCredential: false,
                        user: {
                            id: 19,
                            firstName: 'john',
                            lastName: 'doe',
                            avatar: '',
                        },
                    },
                },
            },
        },
    },
    loginInfo: {
        req: {
            correct: {
                jwtMethod: {
                    email: 'correctEmail@gmail.com',
                    password: mockUserInfo.correctPassword,
                },
                appMFAMethod: {
                    email: 'correctEmailAppMFA@gmail.com',
                    password: mockUserInfo.correctPassword,
                },
            },
            wrong: {
                emailInfo: {
                    email: '123@gmail.com',
                    password: mockUserInfo.correctPassword,
                },
                passwordInfo: {
                    email: 'correctEmail@gmail.com',
                    password: '123456',
                },
            },
        },
        res: {
            jwt: {
                authToken: { accessToken: 'mock access token', refreshToken: 'mock refresh token' },
                email: 'existed@gmail.com',
                enableAppMfa: false,
                isCredential: true,
                id: 1,
            },
        },
    },
    user: {
        disableAppMFA: {
            id: 1,
            firstName: 'Khanh',
            lastName: 'Nguyen',
            email: 'correctEmail@gmail.com',
            password: mockUserInfo.correctPassword,
            picture: 'picture',
            enableAppMFA: false,
            appMFASecret: 'secret',
            isCredential: false,
        },
        enableAppMFA: {
            id: 2,
            firstName: 'Khanh1',
            lastName: 'Nguyen1',
            email: 'correctEmailAppMFA@gmail.com',
            password: mockUserInfo.correctPassword,
            picture: 'picture',
            enableAppMFA: true,
            appMFASecret: 'secret',
            isCredential: false,
        },
    },
};

export const mockRequest = {
    refreshToken: {
        correct: {
            refreshToken: 'correct refresh token',
        },
        wrong: {
            tokenInvalid: {
                refreshToken: 'wrong refresh token',
            },
            userIdInvalid: {
                refreshToken: 'wrong user id in token',
            },
            expiresToken: {
                refreshToken: 'expires refresh token',
            },
        },
    },
    userExist: {
        id: 1,
        firstName: 'john',
        lastName: 'doe',
        picture: 'picture',
        email: 'correctEmail@gmail.com',
    },
    userNotFound: {
        id: 1,
        firstName: 'john',
        lastName: 'doe',
        picture: 'picture',
        email: 'notfound@gmail.com',
    },
};

export const mockResponse = {
    loginJwt: {
        accessToken: 'mock access token',
        refreshToken: 'mock refresh token',
    },
    loginAppMFA: {
        message: 'Please login by validating the appMFA token.',
        validateAppMFA: 'http://localhost:8080/auth/appMFA/validate',
    },
    disableAppMFA: {
        generatedMaps: [],
        raw: [],
        affected: 1,
    },
};

export const mockAccountRepository = {
    findOne: {
        jwt: {
            id: 1,
            email: 'existed@gmail.com',
            password: '123456',
            enableAppMfa: false,
            isCredential: true,
            refreshToken: undefined,
            verifyToken: undefined,
            user: {
                id: 1,
                firstName: 'john',
                lastName: 'doe',
                avatar: '',
                account: undefined,
                email: 'existed@gmail.com',
                password: '123456',
                confirmPassword: '123456',
                isCredential: false,
            },
            firstName: 'john',
            lastName: 'doe',
            avatar: '',
            confirmPassword: '123456',
        },
    },
};

export const mockRefreshTokenRepository = {
    findOne: {
        correct: {
            id: 10,
            accountId: 1,
            token: 'this is mock refresh token',
            expiresAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            createdBy: 1,
            updatedBy: 1,
            deletedBy: null,
            isActive: true,
            account: {
                email: '',
                id: 1,
                version: 1,
                enableAppMfa: false,
                isCredential: false,
                password: '123456',
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                createdBy: 1,
                updatedBy: 1,
                deletedBy: null,
                isActive: true,
                refreshToken: {} as RefreshToken,
                verifyToken: {} as VerifyToken,
                user: {} as User,
            },
        },
        wrong: {
            tokenInvalid: {
                id: 10,
                userId: 1,
                token: 'this is invalid mock refresh token',
                expiresAt: new Date(),
            },
            userIdInvalid: {
                id: 10,
                accountId: 7777,
                token: 'this is mock refresh token',
                expiresAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                createdBy: 1,
                updatedBy: 1,
                deletedBy: null,
                isActive: true,
                account: {
                    email: '',
                    id: 1,
                    version: 1,
                    enableAppMfa: false,
                    isCredential: false,
                    password: '123456',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: new Date(),
                    createdBy: 1,
                    updatedBy: 1,
                    deletedBy: 1,
                    isActive: true,
                    refreshToken: {} as RefreshToken,
                    verifyToken: {} as VerifyToken,
                    user: {} as User,
                },
            },
        },
    },
    delete: {
        accessToken: 'this is mock access token',
        refreshToken: 'this is mock refresh token',
    },
    save: {
        secret: '',
    },
};
