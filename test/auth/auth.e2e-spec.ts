import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'net';
import * as request from 'supertest';
import type { Repository } from 'typeorm';

import { AppModule } from '~/app.module';
import type { CreateAccountDto } from '~/auth/dto';
import { RefreshToken } from '~/auth/entities';

import { mockDto } from '~/__mocks__';

/**
 * - Google OAuth 2.0 không thể test được vì cần phải vào trình duyệt để xác thực.
 * - validateAppMFAToken() không thể test được vì cần lấy OTP từ ứng dụng google authenticator.
 */
describe('Auth', (): void => {
    let app: INestApplication<Server>;

    /**
     * Khởi tại database trước khi chạy tất cả các test case.
     */
    beforeAll(async (): Promise<void> => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    /**
     * - Xóa tất cả dữ liệu trong database sau khi chạy xong mỗi test case.
     */
    afterAll(async (): Promise<void> => {
        const refreshTokenRepository: Repository<RefreshToken> = app.get(getRepositoryToken(RefreshToken));

        await refreshTokenRepository.clear();
        await app.close();
    });

    it('/ (POST) register', async (): Promise<void> => {
        const userDto: CreateAccountDto = mockDto.register.req.newEmail;

        const response: SRes<typeof mockDto.register.res.service.register.complete> = await request(app.getHttpServer()).post('/auth/register').send(userDto);

        expect(response.status).toBe(201);
        expect(response.body.email).toEqual(userDto.email);
        expect(response.body.enableAppMfa).toEqual(false);
        expect(response.body.isCredential).toEqual(userDto.isCredential);
        expect(response.body.user.avatar).toBe(userDto.avatar);
        expect(response.body.user.firstName).toBe(userDto.firstName);
        expect(response.body.user.lastName).toBe(userDto.lastName);
    });
});
