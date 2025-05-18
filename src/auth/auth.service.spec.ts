// import '~/utils/safeExecutionExtensions';

import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { FindOneOptions, Repository } from 'typeorm';

import { AuthService } from '~/auth/auth.service';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';

import { ConflictException } from '@nestjs/common';
import { mockDto } from '~root/__mocks__';

describe('AuthService', () => {
    let authService: AuthService;
    let configService: ConfigService;
    let jwtService: JwtService;
    let accountRepository: Repository<Account>;
    let refreshTokenRepository: Repository<RefreshToken>;
    let verifyTokenRepository: Repository<VerifyToken>;

    beforeEach(async (): Promise<void> => {
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
                                return { id: 1, email: mockDto.register.req.existedEmail.email, enableAppMfa: false, isCredential: false };
                            }

                            return null;
                        }),
                        save: jest.fn().mockResolvedValue(mockDto.register.res.repository.account.save),
                    },
                },
                {
                    provide: getRepositoryToken(RefreshToken),
                    useValue: {},
                },
                {
                    provide: getRepositoryToken(VerifyToken),
                    useValue: {},
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
        accountRepository = module.get<Repository<Account>>(getRepositoryToken(Account));
        refreshTokenRepository = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
        verifyTokenRepository = module.get<Repository<VerifyToken>>(getRepositoryToken(VerifyToken));
    });

    it('should be defined', (): void => {
        expect(authService).toBeDefined();
        expect(configService).toBeDefined();
        expect(jwtService).toBeDefined();
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
});
