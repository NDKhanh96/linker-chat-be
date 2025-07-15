export const mockResponseData = {
    register: {
        id: 17,
        email: '18@gmail.com',
        enableAppMfa: false,
        isCredential: false,
        user: {
            id: 17,
            firstName: 'john',
            lastName: 'doe',
            avatar: '',
        },
    },
    login: {
        authToken: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        },
        email: '1@gmail.com',
        enableAppMfa: false,
        isCredential: false,
        id: 1,
    },
    refreshToken: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
    },
    enableAppMFA: {
        // cspell:disable-next-line
        secret: 'JBSWY3DPEHPK3PXP',
    },
    disableAppMFA: {
        secret: '',
    },
    validateAppMFA: {
        verified: true,
    },
};
