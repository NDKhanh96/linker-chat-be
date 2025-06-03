import { MailerService } from '@nestjs-modules/mailer';
import { ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, genSalt, hash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import type { Repository } from 'typeorm';
import { v4 } from 'uuid';

import type { AuthTokenDto, CreateAccountDto, LoginAppMfaResDto, LoginDto } from '~/auth/dto';
import { LoginJwtResDto } from '~/auth/dto';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import type { LoginResponse } from '~/types';
import { User } from '~/user/entities';
import type { EnvFileVariables } from '~utils/environment';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

        @InjectRepository(VerifyToken)
        private readonly verifyTokenRepository: Repository<VerifyToken>,

        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,

        private readonly configService: ConfigService<EnvFileVariables, true>,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
    ) {}

    async register(accountDTO: CreateAccountDto): Promise<Account> {
        const emailExists: Account | null = await this.accountRepository.findOne({ where: { email: accountDTO.email } });

        if (emailExists) {
            throw new ConflictException('Email already exists');
        }

        accountDTO.password = await this.hashPassword(accountDTO.password);

        const account = new Account({
            ...accountDTO,
            user: new User({ ...accountDTO }),
        });

        const [savedAccountError, savedAccount] = await this.accountRepository.save(account).toSafe();

        if (savedAccountError) {
            throw new UnprocessableEntityException(savedAccountError);
        }

        /**
         * Cần phải dùng plainToInstance để kích hoạt được @Exclude và @Expose trong entities.
         * @Exclude chỉ loại bỏ các thuộc tính được đánh dấu @Exclude trong class, trong trường hợp này có những thuộc tính không có trong class vẫn dc trả về.
         * Vậy nên cần excludeExtraneousValues: true để chỉ trả về những thuộc tính được đánh dấu @Expose .
         */
        return plainToInstance(Account, savedAccount, { excludeExtraneousValues: true });
    }

    async login(loginDTO: LoginDto): Promise<LoginResponse> {
        const { email, password } = loginDTO;
        const account: Account | null = await this.accountRepository.findOne({ where: { email } });

        if (!account) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const [error, passwordMatch] = await compare(password, account.password).toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        if (!passwordMatch) {
            throw new UnauthorizedException('Wrong email or password');
        }

        if (account.enableAppMfa && account.verifyToken.appMfaSecret) {
            return this.generateAppMfaUrl();
        }

        const authToken: AuthTokenDto = await this.generateUserTokens(account.email, account.id);

        return plainToInstance(LoginJwtResDto, { ...account, authToken }, { excludeExtraneousValues: true });
    }

    async googleLogin(req: Express.Request): Promise<LoginResponse> {
        if (!req.user) {
            throw new UnauthorizedException('Google authentication failed');
        }

        const { firstName, lastName, avatar, email } = req.user;
        let account: Account | null = await this.accountRepository.findOne({ where: { email } });

        if (!account) {
            account = await this.register({
                firstName: firstName ?? '',
                lastName: lastName ?? '',
                avatar: avatar ?? '',
                email,
                password: '',
                confirmPassword: '',
                isCredential: false,
            });
        }

        const authToken: AuthTokenDto = await this.generateUserTokens(account.email, account.id);

        return plainToInstance(LoginJwtResDto, { ...account, authToken }, { excludeExtraneousValues: true });
    }

    async generateUserTokens(userEmail: string, userId: number): Promise<AuthTokenDto> {
        const payload = {
            email: userEmail,
            sub: userId,
        };
        const accessToken: string = this.jwtService.sign(payload);
        const refreshToken: string = v4();

        await this.storeRefreshToken(refreshToken, userId);

        return {
            accessToken,
            refreshToken,
        };
    }

    async storeRefreshToken(token: string, userId: number): Promise<void> {
        const expiresIn = parseInt(this.configService.get('REFRESH_TOKEN_EXPIRES_IN', { infer: true }), 10);
        const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);

        const [error] = await this.refreshTokenRepository.upsert({ token, userId, expiresAt }, ['userId']).toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    generateAppMfaUrl(): LoginAppMfaResDto {
        const baseUrl: string = this.configService.get('BASE_URL', { infer: true });

        return {
            validateAppMFA: `${baseUrl}/auth/appMFA/validate`,
            message: 'Please login by validating the appMFA token.',
        };
    }

    /**
     * Có thể sử dụng mà không cần bắt ngoại lệ.
     */
    async hashPassword(password: string): Promise<string> {
        const [genSaltError, salt] = await genSalt().toSafe();

        if (genSaltError) {
            throw new ServiceUnavailableException(genSaltError);
        }
        const [hashError, hashPassword] = await hash(password, salt).toSafe();

        if (hashError) {
            throw new ServiceUnavailableException(hashError);
        }

        return hashPassword;
    }
}
