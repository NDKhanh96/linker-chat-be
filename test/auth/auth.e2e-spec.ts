/**
 * Cần unmock để dùng các thư viện thật trong test.
 * Những thư viện mock vốn chỉ dùng trong unit test.
 * Trong e2e test, ta cần dùng các thư viện thật để test các tính năng 1 cách thực tế.
 */
jest.unmock('bcrypt');

import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Server } from 'net';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '~/app.module';
import type { CreateAccountDto } from '~/auth/dto';
import type { QueryGoogleAuth, QueryGoogleCallback } from '~/types';

import { mockDto } from '~/__mocks__';

/**
 * - Google OAuth 2.0 không thể test được vì cần phải vào trình duyệt để xác thực.
 * - validateTotpToken() không thể test được vì cần lấy OTP từ ứng dụng google authenticator.
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

        const dataSource: DataSource = app.get(DataSource);

        await dataSource.synchronize(true);
    });

    /**
     * - Xóa tất cả dữ liệu trong database sau khi chạy xong tất cả test case.
     */
    afterAll(async (): Promise<void> => {
        const dataSource: DataSource = app.get(DataSource);

        await dataSource.synchronize(true);
        await app.close();
    });

    it('/register (POST)', async (): Promise<void> => {
        const userDto: CreateAccountDto = mockDto.register.req.newEmail;

        const response: SRes<typeof mockDto.register.res.service.register.complete> = await request(app.getHttpServer()).post('/auth/register').send(userDto);

        expect(response.status).toBe(201);
        expect(response.body.email).toEqual(userDto.email);
        expect(response.body.enableTotp).toEqual(false);
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

    describe('/auth/refresh (POST)', () => {
        let refreshToken: string;

        beforeAll(async () => {
            const testUser = {
                firstName: 'refresh',
                lastName: 'user',
                avatar: '',
                email: 'refresh-test@gmail.com',
                password: '123456',
                confirmPassword: '123456',
                isCredential: true,
            };

            await request(app.getHttpServer()).post('/auth/register').send(testUser);

            const loginResponse: SRes<typeof mockDto.loginInfo.res.jwt> = await request(app.getHttpServer()).post('/auth/login').send({
                email: testUser.email,
                password: testUser.password,
            });

            refreshToken = loginResponse.body.authToken.refreshToken;
        });

        it('should refresh token successfully with valid refresh token', async () => {
            const response: SRes<{ accessToken: string; refreshToken: string }> = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.accessToken).toBeDefined();
            expect(response.body.refreshToken).toBeDefined();
            expect(typeof response.body.accessToken).toBe('string');
            expect(typeof response.body.refreshToken).toBe('string');
        });

        it('should return 401 with invalid refresh token', async () => {
            const response: SRes<{ message: string }> = await request(app.getHttpServer())
                .post('/auth/refresh')
                .send({ refreshToken: 'invalid-refresh-token' });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Refresh Token Invalid');
        });

        it('should return 401 with expired refresh token', async () => {
            const expiredToken = 'expired-token';
            const response: SRes<{ message: string }> = await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: expiredToken });

            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Refresh Token Invalid');
        });
    });

    describe('/auth/totp/toggle (POST)', () => {
        let accessToken: string;

        beforeAll(async () => {
            const testUser = {
                firstName: 'mfa',
                lastName: 'user',
                avatar: '',
                email: 'mfa-test@gmail.com',
                password: '123456',
                confirmPassword: '123456',
                isCredential: true,
            };

            await request(app.getHttpServer()).post('/auth/register').send(testUser);

            const loginResponse: SRes<{ authToken: { accessToken: string } }> = await request(app.getHttpServer()).post('/auth/login').send({
                email: testUser.email,
                password: testUser.password,
            });

            accessToken = loginResponse.body.authToken.accessToken;
        });

        it('should enable TOTP successfully', async () => {
            const response: SRes<{ secret: string }> = await request(app.getHttpServer())
                .post('/auth/totp/toggle')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ toggle: true });

            expect(response.status).toBe(200);
            expect(response.body.secret).toBeDefined();
            expect(typeof response.body.secret).toBe('string');
            expect(response.body.secret.length).toBeGreaterThan(0);
        });

        it('should throw UnprocessableEntityException when TOTP is already enabled', async () => {
            const response: SRes<{ message: string }> = await request(app.getHttpServer())
                .post('/auth/totp/toggle')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ toggle: true });

            expect(response.status).toBe(422);
            expect(response.body.message).toBe('TOTP is already enabled');
        });

        it('should disable app TOTP successfully', async () => {
            const response: SRes<{ secret: string }> = await request(app.getHttpServer())
                .post('/auth/totp/toggle')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ toggle: false });

            expect(response.status).toBe(200);
            expect(response.body.secret).toBe('');
        });

        it('should return 401 without authorization header', async () => {
            const response = await request(app.getHttpServer()).post('/auth/totp/toggle').send({ toggle: true });

            expect(response.status).toBe(401);
        });

        it('should return 401 with invalid token', async () => {
            const response = await request(app.getHttpServer()).post('/auth/totp/toggle').set('Authorization', 'Bearer invalid-token').send({ toggle: true });

            expect(response.status).toBe(401);
        });
    });

    describe('/auth/totp/validate (POST)', () => {
        let accessToken: string;

        beforeAll(async () => {
            const testUser = {
                firstName: 'mfa-validate',
                lastName: 'user',
                avatar: '',
                email: 'mfa-validate-test@gmail.com',
                password: '123456',
                confirmPassword: '123456',
                isCredential: true,
            };

            await request(app.getHttpServer()).post('/auth/register').send(testUser);

            const loginResponse: SRes<{ authToken: { accessToken: string } }> = await request(app.getHttpServer()).post('/auth/login').send({
                email: testUser.email,
                password: testUser.password,
            });

            accessToken = loginResponse.body.authToken.accessToken;

            expect(accessToken).toBeDefined();
        });

        it('should return 401 without authorization header', async () => {
            const response = await request(app.getHttpServer()).post('/auth/totp/validate').send({ token: '123456' });

            expect(response.status).toBe(401);
        });

        it('should return 401 with invalid access token', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/totp/validate')
                .set('Authorization', 'Bearer invalid-token')
                .send({ token: '123456' });

            expect(response.status).toBe(401);
        });

        /**
         * Note: Không thể test với OTP token thật vì cần ứng dụng Google Authenticator
         * để tạo token hợp lệ. Test này chỉ kiểm tra response format.
         */
        it('should return validation result for invalid OTP token', async () => {
            const totpResponse = await request(app.getHttpServer())
                .post('/auth/totp/toggle')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ toggle: true });

            expect(totpResponse.status).toBe(200);

            const response: SRes<{ verified: boolean }> = await request(app.getHttpServer())
                .post('/auth/totp/validate')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ token: '000000' });

            expect(response.status).toBe(401);
        });
    });
});
