import '~utils/safe-execution-extension';

import { MailerService } from '@nestjs-modules/mailer';
import { HttpService } from '@nestjs/axios';
import { ConflictException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as httpMocks from 'node-mocks-http';
import { of } from 'rxjs';
import type { EntityManager, FindOneOptions, Repository } from 'typeorm';

import { AuthService } from '~/auth/auth.service';
import { LoginCredentialResDto } from '~/auth/dto';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import type { QueryGoogleAuth, QueryGoogleCallback } from '~/types';

import { mockAccountRepository, mockDto, mockRefreshTokenRepository, mockRequest, mockTotpData } from '~/__mocks__';

describe('AuthService', () => {
    let authService: AuthService;
    let configService: ConfigService;
    let jwtService: JwtService;
    let httpService: HttpService;
    let mailerService: MailerService;
    let accountRepository: Repository<Account>;
    let refreshTokenRepository: Repository<RefreshToken>;
    let verifyTokenRepository: Repository<VerifyToken>;

    afterEach(() => {
        jest.restoreAllMocks();
    });
    beforeEach(async (): Promise<void> => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            /**
             * Inject các dependency cần thiết cho service để khởi tạo testing module.
             * Cách nhận biết các dependency cần thiết là dựa vào constructor của service.
             * Như ví dụ này, AuthService cần 4 dependency: RefreshToken, UserService, ConfigService, JwtService
             */
            providers: [
                /**
                 * Vì đang viết test cho AuthService nên cần import AuthService .
                 */
                AuthService,
                /**
                 * Vì không cần test ConfigService, JwtService nên thay vì import từ module thật, ta sẽ giả lập chúng.
                 */
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string): 'http://localhost:8080' | '1d' | undefined => {
                            if (key === 'BASE_URL') {
                                return 'http://localhost:8080';
                            }

                            if (key === 'REFRESH_TOKEN_EXPIRES_IN') {
                                return '1d';
                            }
                        }),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock access token'),
                        decode: jest.fn().mockReturnValue({ header: { kid: 'mock-kid' } }),
                    },
                },
                {
                    provide: HttpService,
                    useValue: {
                        post: jest.fn().mockReturnValue(of({ data: { id_token: 'mock-id-token' } })),
                        get: jest.fn().mockReturnValue(
                            of({
                                data: {
                                    keys: [
                                        {
                                            kid: 'mock-kid',
                                            kty: 'RSA',
                                            alg: 'RS256',
                                            use: 'sig',
                                            n: 'mock_n',
                                            e: 'A',
                                        },
                                    ],
                                },
                            }),
                        ),
                    },
                },
                /**
                 * Vì quá trình test không kết nối đến database thật nên các method của repository sẽ không hoạt động.
                 * Vậy nên ta cần giả lập repository bằng cách mock nó.
                 */
                {
                    /**
                     * Tên của repository cần mock phải trùng với tên của repository thật.
                     */
                    provide: getRepositoryToken(Account),
                    /**
                     * Thêm các method mock với tên giống với method của repository thật.
                     */
                    useValue: {
                        findOne: jest.fn((options: FindOneOptions<Account>) => {
                            if (Array.isArray(options.where)) {
                                throw new Error('Chưa xử lý trường hợp where là mảng');
                            }

                            if (options.where?.email === mockDto.register.req.existedEmail.email) {
                                return mockAccountRepository.findOne.jwt;
                            }
                            if (options.where?.id === mockAccountRepository.findOne.JWT_TOTP_TRUE.id) {
                                return mockAccountRepository.findOne.JWT_TOTP_TRUE;
                            }

                            return null;
                        }),
                        save: jest.fn().mockResolvedValue(mockDto.register.res.repository.account.save),
                        manager: {
                            transaction: jest.fn().mockImplementation(async (callback: (manager: Partial<EntityManager>) => Promise<void>) => {
                                const mockTransactionManager: Partial<EntityManager> = {
                                    update: jest.fn().mockResolvedValue({}),
                                    save: jest.fn().mockResolvedValue({}),
                                };

                                await callback(mockTransactionManager);

                                return Promise.resolve();
                            }),
                        },
                    },
                },
                {
                    provide: getRepositoryToken(RefreshToken),
                    /**
                     * Thêm các method mock với tên giống với method của refreshTokenRepository thật.
                     */
                    useValue: {
                        findOne: jest.fn().mockImplementation(({ where: { token: refreshToken } }: { where: { token: string } }): RefreshToken | null => {
                            if (refreshToken === mockRequest.refreshToken.correct.refreshToken) {
                                return mockRefreshTokenRepository.findOne.correct;
                            }

                            if (refreshToken === mockRequest.refreshToken.wrong.tokenInvalid.refreshToken) {
                                return null;
                            }

                            if (refreshToken === mockRequest.refreshToken.wrong.userIdInvalid.refreshToken) {
                                return mockRefreshTokenRepository.findOne.wrong.userIdInvalid;
                            }

                            if (refreshToken === mockRequest.refreshToken.wrong.expiresToken.refreshToken) {
                                return null;
                            }

                            return null;
                        }),
                        delete: jest.fn().mockResolvedValue(mockRefreshTokenRepository.delete),
                        save: jest.fn().mockResolvedValue(mockRefreshTokenRepository.save),
                        upsert: jest.fn().mockResolvedValue([null, {}]),
                    },
                },
                {
                    provide: getRepositoryToken(VerifyToken),
                    useValue: {
                        update: jest.fn().mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] }),
                    },
                },
                {
                    provide: MailerService,
                    useValue: {
                        sendMail: jest.fn().mockResolvedValue([null, 'mock result']),
                    },
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        configService = module.get<ConfigService>(ConfigService);
        jwtService = module.get<JwtService>(JwtService);
        httpService = module.get<HttpService>(HttpService);
        mailerService = module.get<MailerService>(MailerService);
        accountRepository = module.get<Repository<Account>>(getRepositoryToken(Account));
        refreshTokenRepository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
        verifyTokenRepository = module.get<Repository<VerifyToken>>(getRepositoryToken(VerifyToken));
    });

    it('should be defined', (): void => {
        expect(authService).toBeDefined();
        expect(configService).toBeDefined();
        expect(jwtService).toBeDefined();
        expect(httpService).toBeDefined();
        expect(mailerService).toBeDefined();
        expect(accountRepository).toBeDefined();
        expect(refreshTokenRepository).toBeDefined();
        expect(verifyTokenRepository).toBeDefined();
    });

    /**
     * Test những method của AuthService.
     * Lưu ý rằng khác với thực tế là AuthService sử dụng các service gốc của UserService, ConfigService,..
     * thì jest lại khiến AuthService sử dụng những method mock ở providers được viết ở trên.
     */

    describe('Method: register', (): void => {
        it('should create a user', async (): Promise<void> => {
            const user: Account = await authService.register(mockDto.register.req.newEmail);

            expect(user).toEqual(mockDto.register.res.service.register.complete);
        });

        it('should not create a user by email is existed', async (): Promise<void> => {
            const user: Promise<Account> = authService.register(mockDto.register.req.existedEmail);

            await expect(user).rejects.toThrow(new ConflictException('Email already exists'));
        });
    });

    describe('Method: login', (): void => {
        it('should login successfully', async (): Promise<void> => {
            const loginDTO = { email: mockDto.register.req.existedEmail.email, password: mockDto.register.req.existedEmail.password };
            const response = await authService.login(loginDTO);

            expect(response).toEqual(mockDto.loginInfo.res.jwt);
        });

        it('should throw UnauthorizedException if email does not exist', async (): Promise<void> => {
            const loginDTO = { email: '1@gmail.com', password: '123456' };
            const loginPromise: Promise<unknown> = authService.login(loginDTO);

            await expect(loginPromise).rejects.toThrow('Invalid credentials');
        });

        it('should throw UnauthorizedException if password is incorrect', async (): Promise<void> => {
            const loginDTO = { email: mockDto.register.req.existedEmail.email, password: 'wrongPassword' };
            const loginPromise: Promise<unknown> = authService.login(loginDTO);

            await expect(loginPromise).rejects.toThrow('Wrong email or password');
        });

        it('should redirect with error if client_id is not supported', () => {
            const query: QueryGoogleAuth = {
                client_id: 'not_provided' as QueryGoogleAuth['client_id'],
                code_challenge: '',
                code_challenge_method: '',
                redirect_uri: 'myapp://callback|raw-state-value',
                response_type: '',
                scope: '',
                state: '',
            };
            const response = httpMocks.createResponse();
            const spy = jest.spyOn(response, 'redirect');

            authService.socialLogin(response, query);

            expect(spy).toHaveBeenCalledTimes(1);
            const redirectUrl = spy.mock.calls[0][0];

            expect(redirectUrl).toContain('myapp://callback?');
            expect(redirectUrl).toContain('error=not_supported');
            expect(redirectUrl).toContain('myapp://callback?error=not_supported&message=Invalid+client_id&state=raw-state-value');
            expect(redirectUrl).toContain('state=raw-state-value');
        });

        it('should call googleAuthorize if provider is google', () => {
            const query: QueryGoogleAuth = {
                client_id: 'google',
                code_challenge: '',
                code_challenge_method: '',
                redirect_uri: '',
                response_type: '',
                scope: '',
                state: '',
            };
            const response = httpMocks.createResponse();
            const spy = jest.spyOn(authService, 'googleAuthorize');

            authService.socialLogin(response, query);

            expect(spy).toHaveBeenCalledWith(response, query);
        });

        it('should redirect to Google OAuth URL with correct params', () => {
            const response = httpMocks.createResponse();

            const query: QueryGoogleAuth = {
                scope: 'email profile',
                state: 'test-state',
                code_challenge: 'test-challenge',
                code_challenge_method: 'S256',
                redirect_uri: 'http://localhost:3000/callback',
                client_id: 'google',
                response_type: 'code',
            };

            Reflect.set(authService, 'googleClientId', 'mock-google-client-id');
            Reflect.set(authService, 'callbackUri', 'http://localhost:8080/api/auth/google/callback');

            const spy = jest.spyOn(response, 'redirect');

            authService.googleAuthorize(response, query);

            expect(spy).toHaveBeenCalledTimes(1);

            const redirectUrl = spy.mock.calls[0][0];

            expect(redirectUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth?');
            expect(redirectUrl).toContain('client_id=mock-google-client-id');
            // cspell:disable-next-line
            expect(redirectUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fauth%2Fgoogle%2Fcallback');
            expect(redirectUrl).toContain('scope=email+profile');
            // cspell:disable-next-line
            expect(redirectUrl).toContain('state=http%3A%2F%2Flocalhost%3A3000%2Fcallback%7Ctest-state');
            expect(redirectUrl).toContain('code_challenge=test-challenge');
            expect(redirectUrl).toContain('code_challenge_method=S256');
            expect(redirectUrl).toContain('prompt=select_account');
            expect(redirectUrl).toContain('response_type=code');
        });

        it('should redirect to appScheme with code and state as query params', () => {
            const response = httpMocks.createResponse();

            const query: QueryGoogleCallback = {
                code: 'test-code',
                scope: 'email profile',
                state: 'myapp://callback|raw-state-value',
                authuser: '0',
                prompt: 'consent',
            };

            const spy = jest.spyOn(response, 'redirect');

            authService.googleCallback(response, query);

            expect(spy).toHaveBeenCalledTimes(1);

            const redirectUrl = spy.mock.calls[0][0];

            expect(redirectUrl).toContain('myapp://callback?');
            expect(redirectUrl).toContain('code=test-code');
            expect(redirectUrl).toContain('state=raw-state-value');
        });

        it('should login with existing account', async () => {
            jest.spyOn(JwtService.prototype, 'verify').mockReturnValue({
                email: '20@gmail.com',
                picture: 'avatar_url',
                given_name: 'Test',
                family_name: 'User',
            });

            const body = { code: 'test-code', codeVerifier: 'test-verifier' };

            const result = await authService.googleLogin(body);

            expect(result).toBeInstanceOf(LoginCredentialResDto);
            expect(result).toEqual({
                authToken: {
                    accessToken: 'mock access token',
                    refreshToken: 'mock refresh token',
                },
                email: '20@gmail.com',
                enableTotp: false,
                isCredential: false,
                id: 19,
            });
        });

        it('should register and login if account does not exist', async () => {});

        it('should throw UnauthorizedException if Google token is invalid', async () => {
            const body = { code: 'bad-code', codeVerifier: 'bad-verifier' };

            await expect(authService.googleLogin(body)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('Method: refreshToken', () => {
        it('should return new tokens when refresh token is valid', async () => {
            jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValue(mockRefreshTokenRepository.findOne.correct);

            const mockTokens = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            };

            jest.spyOn(authService, 'generateAccountTokens').mockResolvedValue(mockTokens);

            const result = await authService.refreshToken('valid-refresh-token');

            expect(result).toEqual(mockTokens);
        });

        it('should throw UnauthorizedException when refresh token is invalid', async () => {
            jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValue(null);

            await expect(authService.refreshToken('invalid-token')).rejects.toThrow(new UnauthorizedException('Refresh Token Invalid'));
        });

        it('should throw UnauthorizedException when refresh token is expired', async () => {
            jest.spyOn(refreshTokenRepository, 'findOne').mockResolvedValue(null);

            await expect(authService.refreshToken('expired-token')).rejects.toThrow(new UnauthorizedException('Refresh Token Invalid'));
        });
    });

    describe('TOTP Operations', () => {
        describe('Method: enableTotp', () => {
            it('should enable TOTP and return new secret when TOTP is disabled', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.validAccount);

                const result = await authService.toggleTotp(1, true);

                expect(result).toHaveProperty('secret');
                expect(typeof result.secret).toBe('string');
                expect(result.secret).not.toBe('');
            });

            it('should throw UnauthorizedException when account not found', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(null);

                await expect(authService.toggleTotp(999, true)).rejects.toThrow(UnauthorizedException);
            });
        });

        describe('Method: disableTotp', () => {
            it('should disable TOTP and return empty secret', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.enabledTotpAccount);

                const result = await authService.toggleTotp(1, false);

                expect(result).toEqual({ secret: '' });
            });

            it('should throw UnprocessableEntityException when TOTP is not enabled', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.disabledTotpAccount);

                await expect(authService.toggleTotp(1, false)).rejects.toThrow(new UnprocessableEntityException('TOTP is already disabled'));
            });

            it('should throw UnauthorizedException when account not found', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(null);

                await expect(authService.toggleTotp(999, false)).rejects.toThrow(UnauthorizedException);
            });
        });

        describe('Method: validateTotpToken', () => {
            it('should return verified true when token is valid', async () => {
                jest.spyOn(authService, 'handleVerifyOtp').mockReturnValue(true);

                const result = await authService.validateTotpToken(2, '123456');

                expect(result).toEqual({ verified: true });
            });

            it('should return verified false when token is invalid', async () => {
                jest.spyOn(authService, 'handleVerifyOtp').mockReturnValue(false);

                const result = await authService.validateTotpToken(2, '000000');

                expect(result).toEqual({ verified: false });
            });

            it('should throw UnprocessableEntityException when TOTP is not enabled', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.disabledTotpAccount);

                await expect(authService.validateTotpToken(1, '123456')).rejects.toThrow(new UnprocessableEntityException('TOTP is not enabled'));
            });

            it('should throw UnauthorizedException when account not found', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(null);

                await expect(authService.validateTotpToken(999, '123456')).rejects.toThrow(UnauthorizedException);
            });
        });
    });

    describe('Email OTP Operations', () => {
        describe('Method: toggleEmailOtp', () => {
            it('should enable email OTP and send OTP email successfully', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.validAccount);

                const handleToggleEmailOtpSpy = jest.spyOn(authService, 'handleToggleEmailOtp').mockResolvedValue();
                const generateEmailOtpSpy = jest.fn().mockReturnValue('123456');
                const sendOtpEmailSpy = jest.fn().mockResolvedValue(undefined);

                Reflect.set(authService, 'generateEmailOtp', generateEmailOtpSpy);
                Reflect.set(authService, 'sendOtpEmail', sendOtpEmailSpy);

                const result = await authService.toggleEmailOtp(1, true);

                expect(result).toEqual({ message: 'OTP sent to email successfully' });
                expect(handleToggleEmailOtpSpy).toHaveBeenCalledWith(mockTotpData.validAccount, true, expect.any(String));
            });

            it('should disable email OTP successfully', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.enabledEmailOtpAccount);

                const handleToggleEmailOtpSpy = jest.spyOn(authService, 'handleToggleEmailOtp').mockResolvedValue();

                const result = await authService.toggleEmailOtp(4, false);

                expect(result).toEqual({ message: 'Email OTP disabled successfully' });
                expect(handleToggleEmailOtpSpy).toHaveBeenCalledWith(mockTotpData.enabledEmailOtpAccount, false);
            });

            it('should throw ServiceUnavailableException when email sending fails', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.validAccount);
                jest.spyOn(authService, 'handleToggleEmailOtp').mockResolvedValue();

                const generateEmailOtpSpy = jest.fn().mockReturnValue('123456');
                const emailError = new Error('Email service unavailable');
                const sendOtpEmailSpy = jest.fn().mockRejectedValue(emailError);

                Reflect.set(authService, 'generateEmailOtp', generateEmailOtpSpy);
                Reflect.set(authService, 'sendOtpEmail', sendOtpEmailSpy);

                await expect(authService.toggleEmailOtp(1, true)).rejects.toThrow('Email service unavailable');
            });

            it('should throw UnauthorizedException when account not found', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(null);

                await expect(authService.toggleEmailOtp(999, true)).rejects.toThrow('Invalid credentials');
            });
        });

        describe('Method: validateEmailOtpToken', () => {
            it('should validate email OTP token successfully and return verified true', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.enabledEmailOtpAccount);

                const handleVerifyOtpSpy = jest.spyOn(authService, 'handleVerifyOtp').mockReturnValue(true);

                const updateSpy = jest.spyOn(verifyTokenRepository, 'update').mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

                const result = await authService.validateEmailOtpToken(4, '123456');

                expect(result).toEqual({ verified: true });
                expect(handleVerifyOtpSpy).toHaveBeenCalledWith('123456', expect.any(Object), mockTotpData.enabledEmailOtpAccount.email, 300);
                expect(updateSpy).toHaveBeenCalledWith({ account: { id: 4 } }, { emailOtpSecret: '' });
            });

            it('should validate email OTP token and return verified false', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.enabledEmailOtpAccount);
                jest.spyOn(authService, 'handleVerifyOtp').mockReturnValue(false);
                jest.spyOn(verifyTokenRepository, 'update').mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

                const result = await authService.validateEmailOtpToken(4, '000000');

                expect(result).toEqual({ verified: false });
            });

            it('should throw UnprocessableEntityException when email OTP is not enabled', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.validAccount);

                await expect(authService.validateEmailOtpToken(1, '123456')).rejects.toThrow('Email OTP is not enabled');
            });

            it('should throw UnauthorizedException when account not found', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(null);

                await expect(authService.validateEmailOtpToken(999, '123456')).rejects.toThrow('Invalid credentials');
            });

            it('should throw ServiceUnavailableException when update fails', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.enabledEmailOtpAccount);
                jest.spyOn(authService, 'handleVerifyOtp').mockReturnValue(true);

                const updateError = new Error('Database update failed');

                jest.spyOn(verifyTokenRepository, 'update').mockRejectedValue(updateError);

                await expect(authService.validateEmailOtpToken(4, '123456')).rejects.toThrow('Database update failed');
            });

            it('should pass correct parameters to verify OTP', async () => {
                jest.spyOn(accountRepository, 'findOne').mockResolvedValue(mockTotpData.enabledEmailOtpAccount);

                const verifySpy = jest.spyOn(authService, 'handleVerifyOtp').mockReturnValue(true);

                jest.spyOn(verifyTokenRepository, 'update').mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

                await authService.validateEmailOtpToken(4, '654321');

                expect(verifySpy).toHaveBeenCalledWith('654321', expect.any(Object), 'email-otp@gmail.com', 300);
            });
        });
    });

    describe('Email Template Integration', () => {
        it('should call mailerService.sendMail with correct template', async () => {
            const email = 'test@example.com';
            const otpCode = '123456';
            const sendMailSpy = jest.spyOn(mailerService, 'sendMail');

            await mailerService.sendMail({
                to: email,
                subject: 'Your OTP Code - Linker Chat',
                template: './otp-email',
                context: {
                    otpCode,
                    email,
                },
            });

            expect(sendMailSpy).toHaveBeenCalledWith({
                to: email,
                subject: 'Your OTP Code - Linker Chat',
                template: './otp-email',
                context: {
                    otpCode,
                    email,
                },
            });
        });
    });
});
