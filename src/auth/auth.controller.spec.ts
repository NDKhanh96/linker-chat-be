import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as httpMocks from 'node-mocks-http';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import type { Account } from '~/auth/entities';
import type { LoginResponse } from '~/types';

import { mockDto, mockResponseData } from '~/__mocks__';

describe('AuthController', () => {
    let controller: AuthController;

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
                        googleLogin: jest.fn().mockImplementation((req: Express.Request): Promise<LoginResponse> | { message: string } => {
                            if (req.user) {
                                return Promise.resolve({
                                    authToken: { accessToken: '', refreshToken: '' },
                                    email: 'string',
                                    enableAppMfa: false,
                                    isCredential: false,
                                    id: 1,
                                });
                            }
                            throw new UnauthorizedException('Google authentication failed');
                        }),
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
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should be return user information except password', async (): Promise<void> => {
        const userInfo: Account = await controller.register(mockDto.register.req.newEmail);

        expect(userInfo).toEqual(mockResponseData.register);
    });

    it('should be return login response', async (): Promise<void> => {
        const loginResponse: LoginResponse = await controller.login({
            email: '1@gmail.com',
            password: '123456',
        });

        expect(loginResponse).toEqual(mockResponseData.login);
    });

    it('should call have error when user is undefined', async () => {
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/auth/google/login',
            user: { id: 1, email: mockDto.register.req.existedEmail.email },
        });

        const response: LoginResponse = await controller.googleLogin(req);

        expect(response).toHaveProperty('authToken');
    });

    it('should call have error when user is undefined', async () => {
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/auth/google/login',
            user: undefined,
        });

        await expect(controller.googleLogin(req)).rejects.toThrow('Google authentication failed');
    });
});
