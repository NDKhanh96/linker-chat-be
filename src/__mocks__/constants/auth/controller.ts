export const mockResponseData = {
    register: {
        id: 17,
        email: '18@gmail.com',
        enableTotp: false,
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
        enableTotp: false,
        isCredential: false,
        id: 1,
    },
    refreshToken: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
    },
    enableTotp: {
        // cspell:disable-next-line
        secret: 'JBSWY3DPEHPK3PXP',
    },
    disableTotp: {
        secret: '',
    },
    validateTotp: {
        verified: true,
    },
    forgotPassword: {
        message: 'Password reset instructions have been sent to your email',
    },
    resetPassword: {
        message: 'Password has been reset successfully',
    },
};
