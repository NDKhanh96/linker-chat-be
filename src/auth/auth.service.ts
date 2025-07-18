import { MailerService } from '@nestjs-modules/mailer';
import { HttpService } from '@nestjs/axios';
import { ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AxiosError } from 'axios';
import { compare, genSalt, hash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { type Response } from 'express';
import jwkToPem from 'jwk-to-pem';
import * as OTPAuth from 'otpauth';
import { firstValueFrom } from 'rxjs';
import { MoreThanOrEqual, type Repository } from 'typeorm';
import { v4 } from 'uuid';

import type { AuthTokenDto, CreateAccountDto, LoginDto } from '~/auth/dto';
import { GoogleLoginErrorDto, LoginCredentialResDto } from '~/auth/dto';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import type { GoogleIdTokenDecoded, JwksResponse, QueryGoogleAuth, QueryGoogleCallback } from '~/types';
import { User } from '~/user/entities';
import type { EnvFileVariables } from '~utils/environment';

const OTP_CONFIG = {
    ALGORITHM: 'SHA1',
    DIGITS: 6,
    PERIOD: 30,
    /**
     * window: 1 để cho phép mã OTP có thể được sử dụng trước hoặc sau thời gian hiện tại 1 đơn vị thời gian.
     * tránh việc độ trễ mạng cao hoặc máy chủ chậm khiến mã OTP không hợp lệ.
     */
    WINDOW: 1,
} as const;

@Injectable()
export class AuthService {
    /**
     * Đường dẫn callbackUri phải trùng với đường dẫn đã đăng ký trong Google Cloud Console.
     * Đường dẫn này chính là route của controller.
     */
    private readonly callbackUri: string;
    private readonly googleClientId: string;
    private readonly clientSecret: string;
    constructor(
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

        @InjectRepository(VerifyToken)
        private readonly verifyTokenRepository: Repository<VerifyToken>,

        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,

        private readonly configService: ConfigService<EnvFileVariables, true>,
        private readonly jwtService: JwtService,
        private readonly httpService: HttpService,
        private readonly mailerService: MailerService,
    ) {
        this.callbackUri = this.configService.get('BASE_URL', { infer: true }) + '/api/auth/google/callback';
        this.googleClientId = this.configService.get('GOOGLE_CLIENT_ID', { infer: true });
        this.clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET', { infer: true });
    }

    async register(accountDTO: CreateAccountDto): Promise<Account> {
        const emailExists: Account | null = await this.accountRepository.findOne({ where: { email: accountDTO.email } });

        if (emailExists) {
            throw new ConflictException('Email already exists');
        }

        accountDTO.password = await this.hashPassword(accountDTO.password);

        const account = new Account({
            ...accountDTO,
            user: new User({ ...accountDTO }),
            verifyToken: new VerifyToken({}),
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

    async login(loginDTO: LoginDto): Promise<LoginCredentialResDto> {
        const { email, password } = loginDTO;
        const account = await this.findAccountByEmail(email);

        const [error, passwordMatch] = await compare(password, account.password).toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        if (!passwordMatch) {
            throw new UnauthorizedException('Wrong email or password');
        }

        const authToken: AuthTokenDto | undefined = account.enableTotp ? undefined : await this.generateAccountTokens(account.email, account.id);

        return plainToInstance(LoginCredentialResDto, { ...account, authToken }, { excludeExtraneousValues: true });
    }

    async refreshToken(refreshToken: string): Promise<AuthTokenDto> {
        const token: RefreshToken | null = await this.refreshTokenRepository.findOne({
            where: {
                token: refreshToken,
                expiresAt: MoreThanOrEqual(new Date()),
            },
            relations: ['account'],
        });

        if (!token) {
            throw new UnauthorizedException('Refresh Token Invalid');
        }

        return this.generateAccountTokens(token.account.email, token.account.id);
    }

    async enableTotp(accountId: number): Promise<{ secret: string }> {
        const account = await this.findAccountById(accountId);

        if (account.enableTotp) {
            return { secret: account.verifyToken.totpSecret };
        }

        const secret = new OTPAuth.Secret();

        const [error] = await this.accountRepository.manager
            .transaction(async transactionalEntityManager => {
                account.enableTotp = true;
                account.verifyToken.totpSecret = secret.base32;

                await transactionalEntityManager.save(Account, account);
            })
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        return { secret: secret.base32 };
    }

    async disableTotp(accountId: number): Promise<{ secret: string }> {
        const account = await this.findAccountById(accountId);

        if (!account.enableTotp) {
            throw new UnprocessableEntityException('TOTP is not enabled');
        }

        const [error] = await this.accountRepository.manager
            .transaction(async transactionalEntityManager => {
                account.enableTotp = false;
                account.verifyToken.totpSecret = '';

                await transactionalEntityManager.save(Account, account);
            })
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        return { secret: '' };
    }

    async validateTotpToken(accountId: number, token: string): Promise<{ verified: boolean }> {
        const account = await this.findAccountById(accountId);

        if (!account.enableTotp || !account.verifyToken.totpSecret) {
            throw new UnprocessableEntityException('TOTP is not enabled');
        }

        const verified = this.validateEmailOtp(token, OTPAuth.Secret.fromBase32(account.verifyToken.totpSecret), account.email);

        return { verified };
    }

    /**
     * client_id ở đây chỉ là đoạn string mô tả nền tảng đăng nhập của người dùng.
     * Ví dụ: client_id = 'google' thì sẽ là đăng nhập bằng Google.
     * Dùng để điều hướng đến method thực hiện đăng nhập tương ứng.
     * Tại method đó sẽ sử dụng client_id trong .env riêng.
     */
    socialLogin(response: Response, query: QueryGoogleAuth): void {
        const { client_id } = query;

        if (client_id === 'google') {
            return this.googleAuthorize(response, query);
        }

        const errorMessages: Record<typeof client_id, string> = {
            facebook: 'Facebook login is not supported yet',
            github: 'Github login is not supported yet',
        };

        const message: string = errorMessages[client_id] ?? 'Invalid client_id';

        return this.redirectWithError(response, query, 'not_supported', message);
    }

    googleAuthorize(response: Response, query: QueryGoogleAuth): void {
        const { scope, state, code_challenge, code_challenge_method, redirect_uri } = query;

        /**
         * Do google sẽ giữ nguyên state và trả lại trong query string của callback, vậy nên có thể dùng nó để lưu trữ thông tin cần thiết.
         */
        const params = new URLSearchParams({
            client_id: this.googleClientId,
            redirect_uri: this.callbackUri,
            response_type: 'code',
            scope,
            state: redirect_uri + '|' + state,
            prompt: 'select_account',
            code_challenge: code_challenge,
            code_challenge_method: code_challenge_method,
        });

        return response.redirect('https://accounts.google.com/o/oauth2/v2/auth?' + params.toString());
    }

    /**
     * Tại bước này cần code trong query string để lấy access token từ Google.
     * Vì code sẽ dc ghi trong url, vậy nên nếu hacker tự điện code vào thì sẽ không có user trong req.user, đây có thể là lỗ hổng bảo mật.
     * vì lý do đó nên cần phải có thêm state và codeVerifier được gửi từ frontend để xác thực.
     */
    googleCallback(response: Response, query: QueryGoogleCallback): void {
        const { code, state } = query;
        const [appScheme, rawState] = state.split('|');

        const outgoingParams = new URLSearchParams({
            code,
            state: rawState,
        });

        return response.redirect(appScheme + '?' + outgoingParams.toString());
    }

    async googleLogin(body: { code: string; codeVerifier: string }): Promise<LoginCredentialResDto> {
        const [error, userInfo] = await this.getGoogleUserInfo.bind(this).toSafeAsync(body);

        if (error instanceof AxiosError) {
            const data: GoogleLoginErrorDto = plainToInstance(GoogleLoginErrorDto, error.response?.data);

            throw new UnauthorizedException(data.error, data.error_description);
        }

        if (error) {
            throw new UnauthorizedException(error.message, 'Invalid Google token');
        }

        const { email, picture, given_name, family_name } = userInfo;
        let account: Account | null = await this.accountRepository.findOne({ where: { email } });

        if (!account) {
            account = await this.register({
                firstName: given_name ?? '',
                lastName: family_name ?? '',
                avatar: picture ?? '',
                email,
                password: '',
                confirmPassword: '',
                isCredential: false,
            });
        }

        const authToken: AuthTokenDto = await this.generateAccountTokens(account.email, account.id);

        return plainToInstance(LoginCredentialResDto, { ...account, authToken }, { excludeExtraneousValues: true });
    }

    /**
     * Vì JwtService hiện đã dc config để tự động có secret, vậy nên sẽ không thể dùng được publicKey để verify token.
     * Do đó cần phải khởi tạo thêm 1 đối tượng JwtService mới để verify token với publicKey.
     */
    async getGoogleUserInfo(body: { code: string; codeVerifier: string }): Promise<GoogleIdTokenDecoded['payload']> {
        const tokenData = await this.getGoogleToken(body);

        const pubKey = await this.getGooglePublicKey(tokenData.id_token);
        const jwt = new JwtService();

        return jwt.verify(tokenData.id_token, {
            algorithms: ['RS256'],
            publicKey: pubKey,
            issuer: ['https://accounts.google.com', 'accounts.google.com'],
            audience: this.googleClientId,
        });
    }

    private async getGoogleToken(body: { code: string; codeVerifier: string }) {
        const { code, codeVerifier } = body;
        const params = new URLSearchParams({
            client_id: this.googleClientId,
            client_secret: this.clientSecret,
            redirect_uri: this.callbackUri,
            grant_type: 'authorization_code',
            code,
            code_verifier: codeVerifier,
        });

        const res = await firstValueFrom(
            this.httpService.post<{ id_token: string }>('https://oauth2.googleapis.com/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            }),
        );

        return res.data;
    }

    private async getGooglePublicKey(idToken: string): Promise<string> {
        const res = await firstValueFrom(this.httpService.get<JwksResponse>('https://www.googleapis.com/oauth2/v3/certs'));
        const keys = res.data.keys;

        const decodedHeader: GoogleIdTokenDecoded | null = this.jwtService.decode(idToken, { complete: true });

        if (!decodedHeader) {
            throw new UnauthorizedException('Invalid id_token');
        }

        const kid = decodedHeader.header.kid;
        const key = keys.find(k => k.kid === kid);

        if (!key) {
            throw new UnauthorizedException('Google public key not found');
        }

        return jwkToPem(key);
    }

    async generateAccountTokens(accountEmail: string, accountId: number): Promise<AuthTokenDto> {
        const payload = {
            email: accountEmail,
            sub: accountId,
        };
        const accessToken: string = this.jwtService.sign(payload);
        const refreshToken: string = v4();

        await this.storeRefreshToken(refreshToken, accountId);

        return {
            accessToken,
            refreshToken,
        };
    }

    async storeRefreshToken(token: string, accountId: number): Promise<void> {
        const expiresIn = parseInt(this.configService.get('REFRESH_TOKEN_EXPIRES_IN', { infer: true }), 10);
        const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);

        const [error] = await this.refreshTokenRepository.upsert({ token, expiresAt, account: { id: accountId } }, ['account']).toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
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

    private redirectWithError(response: Response, query: QueryGoogleAuth, error: string, message: string): void {
        const [appScheme, state] = query.redirect_uri.split('|');
        const outgoingParams = new URLSearchParams({
            error,
            message,
            state,
        });

        return response.redirect(`${appScheme}?${outgoingParams.toString()}`);
    }

    validateEmailOtp(token: string, secret: OTPAuth.Secret, accountEmail: string): boolean {
        const totp = new OTPAuth.TOTP({
            secret,
            label: accountEmail,
            issuer: 'Linker Chat',
            algorithm: OTP_CONFIG.ALGORITHM,
            digits: OTP_CONFIG.DIGITS,
            period: OTP_CONFIG.PERIOD,
        });

        const [error, result] = totp.validate.bind(totp).toSafe({
            /**
             * window: 1 để cho phép mã OTP có thể được sử dụng trước hoặc sau thời gian hiện tại 1 đơn vị thời gian.
             * tránh việc độ trễ mạng cao hoặc máy chủ chậm khiến mã OTP không hợp lệ.
             */
            window: OTP_CONFIG.WINDOW,
            token,
        });

        if (error || result === null) {
            const message: string = error instanceof Error ? error.message : 'Error while verifying OTP';

            throw new UnauthorizedException(message);
        }

        return typeof result === 'number';
    }

    /**
     * Tìm kiếm tài khoản theo ID và trả về tài khoản nếu tìm thấy - Có relation với verify token.
     * Nếu không tìm thấy tài khoản, ném ra UnauthorizedException - 401.
     * @param accountId - ID của tài khoản cần tìm kiếm.
     * @returns Promise<Account> - Tài khoản nếu tìm thấy.
     * @throws UnauthorizedException - Nếu không tìm thấy tài khoản.
     */
    private async findAccountById(id: number): Promise<Account> {
        const account: Account | null = await this.accountRepository.findOne({
            where: { id },
            relations: ['verifyToken'],
        });

        if (!account) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return account;
    }

    /**
     * Tìm kiếm tài khoản theo email và trả về tài khoản nếu tìm thấy - Có relation với verify token.
     * Nếu không tìm thấy tài khoản, ném ra UnauthorizedException - 401.
     * @param email - Email của tài khoản cần tìm kiếm.
     * @returns Promise<Account> - Tài khoản nếu tìm thấy.
     * @throws UnauthorizedException - Nếu không tìm thấy tài khoản.
     */
    private async findAccountByEmail(email: string): Promise<Account> {
        const account: Account | null = await this.accountRepository.findOne({
            where: { email },
            relations: ['verifyToken'],
        });

        if (!account) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return account;
    }
}
