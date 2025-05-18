import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import type { Account } from '~/auth/entities';

import { mockDto, mockResponseData } from '~root/__mocks__';

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
});
