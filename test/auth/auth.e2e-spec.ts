/**
 * Cần unmock để dùng các thư viện thật trong test.
 * Những thư viện mock vốn chỉ dùng trong unit test.
 * Trong e2e test, ta cần dùng các thư viện thật để test các tính năng 1 cách thực tế.
 */
jest.unmock('bcrypt');

import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Server } from 'net';
import request from 'supertest';
import type { Repository } from 'typeorm';

import { AppModule } from '~/app.module';
import type { CreateAccountDto } from '~/auth/dto';
import { RefreshToken } from '~/auth/entities';
import type { QueryGoogleAuth, QueryGoogleCallback } from '~/types';

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
     * - Xóa tất cả dữ liệu trong database sau khi chạy xong tất cả test case.
     */
    afterAll(async (): Promise<void> => {
        const refreshTokenRepository: Repository<RefreshToken> = app.get(getRepositoryToken(RefreshToken));

        await refreshTokenRepository.clear();
        await app.close();
    });

    it('/register (POST)', async (): Promise<void> => {
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

    it('/login (POST)', async (): Promise<void> => {
        const { email, password } = mockDto.register.req.newEmail;

        const response: SRes<typeof mockDto.loginInfo.res.jwt> = await request(app.getHttpServer()).post('/auth/login').send({ email, password });

        expect(response.status).toBe(200);
        expect(response.body.authToken.accessToken).toBeDefined();
        expect(response.body.authToken.refreshToken).toBeDefined();
    });

    it('/auth/social/login (GET) should redirect to Google OAuth', async () => {
        const googleAuthQuery: QueryGoogleAuth = {
            code_challenge: 'test_challenge',
            code_challenge_method: 'S256',
            redirect_uri: 'myapp://callback',
            client_id: 'google',
            response_type: 'code',
            state: 'test_state',
            scope: 'openid email profile',
        };
        const response = await request(app.getHttpServer()).get('/auth/social/login').query(googleAuthQuery);

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
        expect(response.headers.location).toContain('client_id=');
    });

    it('/auth/google/callback (GET) should redirect to app scheme with code and state', async () => {
        const callbackQuery: QueryGoogleCallback = {
            code: 'test-code',
            state: 'myapp://callback|raw-state-value',
            authuser: '0',
            prompt: 'consent',
            scope: 'openid email profile',
        };

        const response = await request(app.getHttpServer()).get('/auth/google/callback').query(callbackQuery);

        expect(response.status).toBe(302);
        expect(response.headers.location).toContain('myapp://callback?');
        expect(response.headers.location).toContain('code=test-code');
        expect(response.headers.location).toContain('state=raw-state-value');
    });

    /**
     * Trường hợp này thường sẽ fail vì không có Google token thật, nên chỉ test trả về lỗi.
     */
    it('/auth/google/login (POST) should return 401 if Google token is invalid', async () => {
        const body = { code: 'invalid-code', codeVerifier: 'invalid-verifier' };

        const response = await request(app.getHttpServer()).post('/auth/google/login').send(body);

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'Malformed auth code.',
            message: 'invalid_grant',
            statusCode: 401,
        });
    });
});
