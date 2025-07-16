import { Test, TestingModule } from '@nestjs/testing';
import * as httpMocks from 'node-mocks-http';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import type {
    AuthTokenDto,
    LoginCredentialResDto,
    RefreshTokenDto,
    ToggleTotpDto,
    TotpSecretResponseDto,
    TotpValidationResponseDto,
    ValidateTotpTokenDTO,
} from '~/auth/dto';
import type { Account } from '~/auth/entities';
import type { QueryGoogleAuth, QueryGoogleCallback } from '~/types';

import { mockDto, mockResponseData } from '~/__mocks__';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    beforeEach(async (): Promise<void> => {
        /**
         * NestJS tự động tạo ra một fake module.
         * Khi thực hiện compile, nó khởi tạo tất cả các phụ thuộc cần thiết cho module thử nghiệm.
         * Đảm bảo một môi trường thử nghiệm độc lập với môi trường thực tế,
         * nơi các kiểm thử có thể được tiến hành riêng biệt.
         */
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            /**
             * Thay vì dùng AuthService thật, ta sử dụng mock service.
             * Có thể lựa chọn giữa mockResolvedValue và mockImplementation để giả lập kết quả trả về.
             * - MockResolvedValue giả lập kết quả trả về.
             * - MockImplementation giúp giả lập 1 hàm với đầy đủ các logic trong hàm đó.
             */
            providers: [
                {
                    /**
                     * Tên của mock service phải trùng với tên của service thật.
                     */
                    provide: AuthService,
                    /**
                     * Thêm các method mock với tên giống với method của service thật.
                     */
                    useValue: {
                        register: jest.fn().mockResolvedValue(mockResponseData.register),
                        login: jest.fn().mockResolvedValue(mockResponseData.login),
                        refreshToken: jest.fn().mockResolvedValue(mockResponseData.refreshToken),
                        toggleTotp: jest
                            .fn()
                            .mockImplementation((accountId: number, enable: boolean) => (enable ? mockResponseData.enableTotp : mockResponseData.disableTotp)),
                        validateTotpToken: jest.fn().mockResolvedValue(mockResponseData.validateTotp),
                        socialLogin: jest.fn(),
                        googleCallback: jest.fn(),
                        googleLogin: jest.fn(),
                    },
                },
            ],
        }).compile();

        /**
         * Lấy 1 instance của controller dependency bằng method module.get().
         * module.get() đóng vai trò là đường dẫn trực tiếp đến các dependency mong muốn,
         * Lưu ý rằng nếu không phải @Controller({ path: 'songs', scope: Scope.DEFAULT }) mà là Scope.TRANSIENT hay REQUEST thì không dùng dc module.get().
         */
        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('Authentication', () => {
        it('should return user information except password when registering', async (): Promise<void> => {
            const userInfo: Account = await controller.register(mockDto.register.req.newEmail);

            expect(userInfo).toEqual(mockResponseData.register);
        });

        it('should return login response when credentials are valid', async (): Promise<void> => {
            const loginResponse: LoginCredentialResDto = await controller.login({
                email: '1@gmail.com',
                password: '123456',
            });

            expect(loginResponse).toEqual(mockResponseData.login);
        });

        it('should return new access and refresh tokens', async (): Promise<void> => {
            const refreshTokenDto: RefreshTokenDto = {
                refreshToken: 'valid-refresh-token',
            };
            const spy = jest.spyOn(authService, 'refreshToken');

            const authTokenResponse: AuthTokenDto = await controller.refreshToken(refreshTokenDto);

            expect(authTokenResponse).toEqual(mockResponseData.refreshToken);
            expect(spy).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
        });
    });

    describe('Social Authentication', () => {
        it('should call authService.socialLogin with correct params', () => {
            const res = httpMocks.createResponse();
            const query: QueryGoogleAuth = {
                client_id: 'google',
                code_challenge: 'challenge',
                code_challenge_method: 'S256',
                redirect_uri: 'http://localhost/callback',
                response_type: 'code',
                state: 'state',
                scope: 'email profile',
            };

            const spy = jest.spyOn(authService, 'socialLogin');

            controller.socialLogin(res, query);

            expect(spy).toHaveBeenCalledWith(res, query);
        });

        it('should call authService.googleCallback with correct params', () => {
            const res = httpMocks.createResponse();
            const query: QueryGoogleCallback = {
                code: 'test-code',
                state: 'test-state',
                authuser: '0',
                prompt: 'consent',
                scope: 'email profile',
            };
            const spy = jest.spyOn(authService, 'googleCallback');

            controller.googleCallback(res, query);

            expect(spy).toHaveBeenCalledWith(res, query);
        });

        it('should call authService.googleLogin and return login response', async () => {
            const body = { code: 'test-code', codeVerifier: 'test-verifier' };
            const spy = jest.spyOn(authService, 'googleLogin');

            await controller.googleLogin(body);

            expect(spy).toHaveBeenCalledWith(body);
        });
    });

    describe('TOTP Operations', () => {
        const mockAuthenticatedRequest = {
            user: { id: 1 },
        } as Express.AuthenticatedRequest;

        it('should enable TOTP and return secret', async (): Promise<void> => {
            const toggleDto: ToggleTotpDto = { toggle: true };
            const spy = jest.spyOn(authService, 'toggleTotp');

            const response: TotpSecretResponseDto = await controller.toggleTotp(mockAuthenticatedRequest, toggleDto);

            expect(response).toEqual(mockResponseData.enableTotp);
            expect(spy).toHaveBeenCalledWith(mockAuthenticatedRequest.user.id, true);
        });

        it('should disable TOTP and return empty secret', async (): Promise<void> => {
            const toggleDto: ToggleTotpDto = { toggle: false };
            const spy = jest.spyOn(authService, 'toggleTotp');

            const response: TotpSecretResponseDto = await controller.toggleTotp(mockAuthenticatedRequest, toggleDto);

            expect(response).toEqual(mockResponseData.disableTotp);
            expect(spy).toHaveBeenCalledWith(mockAuthenticatedRequest.user.id, false);
        });

        it('should validate TOTP token and return verification result', async (): Promise<void> => {
            const validateTokenDto: ValidateTotpTokenDTO = { token: '123456' };
            const spy = jest.spyOn(authService, 'validateTotpToken');

            const response: TotpValidationResponseDto = await controller.validateTotpToken(mockAuthenticatedRequest, validateTokenDto);

            expect(response).toEqual(mockResponseData.validateTotp);
            expect(spy).toHaveBeenCalledWith(mockAuthenticatedRequest.user.id, validateTokenDto.token);
        });

        it('should pass correct parameters to validate TOTP token service', async (): Promise<void> => {
            const validateTokenDto: ValidateTotpTokenDTO = { token: '654321' };
            const spy = jest.spyOn(authService, 'validateTotpToken');

            await controller.validateTotpToken(mockAuthenticatedRequest, validateTokenDto);

            expect(spy).toHaveBeenCalledWith(1, '654321');
        });
    });
});
