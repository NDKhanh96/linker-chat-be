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
import { readFileSync } from 'fs';
import jwkToPem from 'jwk-to-pem';
import * as OTPAuth from 'otpauth';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';
import { MoreThanOrEqual, type Repository } from 'typeorm';
import { v4 } from 'uuid';

import type {
    AuthTokenDto,
    CreateAccountDto,
    EmailOtpValidationResponseDto,
    ForgotPasswordResponseDto,
    LoginDto,
    ResetPasswordDto,
    ResetPasswordResponseDto,
    TotpSecretResponseDto,
    TotpValidationResponseDto,
    ValidateEmailOtpDto,
    ValidateTotpTokenDTO,
} from '~/auth/dto';
import { GoogleLoginErrorDto, LoginCredentialResDto } from '~/auth/dto';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import type { GoogleIdTokenDecoded, JwksResponse, QueryGoogleAuth, QueryGoogleCallback } from '~/types';
import { User } from '~/user/entities';
import { OtpConfigService } from '~/utils/configs';
import type { EnvFileVariables } from '~utils/environment';

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
        private readonly otpConfigService: OtpConfigService,
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

    /**
     * Nếu chưa kích hoạt email OTP và TOTP thì sẽ trả về authToken.
     * Nếu chỉ kích hoạt email OTP mà không kích hoạt thêm MFA nào khác thì sẽ gửi mã OTP qua email và không trả về authToken.
     * Nếu đã kích hoạt TOTP thì sẽ không trả về authToken, FE cần xử lý để nhập mã TOTP.
     */
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

        let authToken: AuthTokenDto | undefined = undefined;

        if (!account.enableEmailOtp && !account.enableTotp) {
            authToken = await this.generateAccountTokens(account.email, account.id);
        }

        if (account.enableEmailOtp && !account.enableTotp) {
            const [sendEmailError] = await this.sendNewEmailOtp.bind(this).toSafeAsync(account);

            if (sendEmailError) {
                throw new ServiceUnavailableException(sendEmailError.message, sendEmailError.stack);
            }
        }

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

    async toggleTotp(accountId: number, enable: boolean): Promise<TotpSecretResponseDto> {
        const account = await this.findAccountById(accountId);

        if (account.enableTotp === enable) {
            throw new UnprocessableEntityException(`TOTP is already ${enable ? 'enabled' : 'disabled'}`);
        }

        const secret = enable ? new OTPAuth.Secret().base32 : '';

        const [error] = await this.accountRepository.manager
            .transaction(async transactionalEntityManager => {
                account.enableTotp = enable;
                account.verifyToken.totpSecret = secret;

                await transactionalEntityManager.save(Account, account);
            })
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        return { secret };
    }

    async validateTotpToken({ email, token, getAuthTokens }: ValidateTotpTokenDTO): Promise<TotpValidationResponseDto> {
        const account = await this.findAccountByEmail(email);

        if (!account.enableTotp) {
            throw new UnprocessableEntityException('TOTP is not enabled');
        }

        const verified = this.handleVerifyTotp(
            token,
            OTPAuth.Secret.fromBase32(account.verifyToken.totpSecret),
            account.email,
            this.otpConfigService.totpPeriod,
        );

        if (!getAuthTokens) {
            return { verified };
        }

        const authToken = await this.generateAccountTokens(account.email, account.id);

        return { verified, authToken };
    }

    async toggleEmailOtp(accountId: number, enable: boolean): Promise<{ message: string }> {
        const account = await this.findAccountById(accountId);

        if (!enable) {
            await this.handleToggleEmailOtp(account, false);

            return { message: 'Email OTP disabled successfully' };
        }

        await this.handleToggleEmailOtp(account, true);

        await this.sendNewEmailOtp(account);

        return { message: 'OTP sent to email successfully' };
    }

    /**
     * Resend email OTP
     */
    async resendEmailOtp(email: string): Promise<{ message: string }> {
        const account = await this.findAccountByEmail(email);

        if (!account.enableEmailOtp) {
            throw new UnprocessableEntityException('Email OTP is not enabled');
        }

        await this.sendNewEmailOtp(account);

        return { message: 'New OTP sent to email successfully' };
    }

    /**
     * Send new email OTP with resend cooldown check
     */
    async sendNewEmailOtp(account: Account): Promise<void> {
        if (account.verifyToken.emailOtpExpiresAt) {
            const lastSentTime = new Date(account.verifyToken.emailOtpExpiresAt.getTime() - this.otpConfigService.emailOtpTtlMs);
            const cooldownEnd = new Date(lastSentTime.getTime() + this.otpConfigService.emailOtpResendCooldownMs);

            if (new Date() < cooldownEnd) {
                const remainingSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);

                throw new UnprocessableEntityException(`Please wait ${remainingSeconds} seconds before requesting a new OTP`);
            }
        }

        const otpCode = this.generateRandomEmailOtp();
        const expiresAt = new Date(Date.now() + this.otpConfigService.emailOtpTtlMs);

        await this.storeEmailOtp(account.id, otpCode, expiresAt);
        const [sendEmailError] = await this.sendOtpEmail(account.email, otpCode).toSafe();

        if (sendEmailError) {
            throw new ServiceUnavailableException(sendEmailError.message, sendEmailError.stack);
        }
    }

    async validateEmailOtpToken({ email, token, getAuthTokens }: ValidateEmailOtpDto): Promise<EmailOtpValidationResponseDto> {
        const account = await this.findAccountByEmail(email);

        if (!account.enableEmailOtp) {
            throw new UnprocessableEntityException('Email OTP is not enabled');
        }

        if (!account.verifyToken) {
            throw new UnauthorizedException('No OTP found. Please request a new OTP.');
        }

        const verified = await this.validateRandomEmailOtp(token, account);

        await this.clearEmailOtp(account.id);

        if (!getAuthTokens) {
            return { verified };
        }

        const authToken = await this.generateAccountTokens(account.email, account.id);

        return { verified, authToken };
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
     * Send forgot password email with reset token
     */
    async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
        const account = await this.findAccountByEmail(email);

        if (account.verifyToken.forgotPasswordSecret) {
            const parts = account.verifyToken.forgotPasswordSecret.split(':');

            if (parts.length >= 2) {
                const expiresAtStr = parts[1];
                const lastSentTime = new Date(parseInt(expiresAtStr, 10) - this.otpConfigService.resetPasswordTtlMs);
                const cooldownEnd = new Date(lastSentTime.getTime() + this.otpConfigService.resetPasswordResendCooldownMs);

                if (new Date() < cooldownEnd) {
                    const remainingSeconds = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);

                    throw new UnprocessableEntityException(`Please wait ${remainingSeconds} seconds before requesting a new password reset`);
                }
            }
        }

        const resetToken = this.generateResetToken();
        const expiresAt = new Date(Date.now() + this.otpConfigService.resetPasswordTtlMs);

        await this.storeResetToken(account.id, resetToken, expiresAt);

        const [sendEmailError] = await this.sendResetPasswordEmail.bind(this).toSafeAsync(account.email, resetToken);

        if (sendEmailError) {
            throw new ServiceUnavailableException(sendEmailError.message, sendEmailError.stack);
        }

        return { message: 'Password reset instructions have been sent to your email' };
    }

    /**
     * Reset password using reset token
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
        const { email, token, newPassword, confirmPassword } = resetPasswordDto;

        if (newPassword !== confirmPassword) {
            throw new UnprocessableEntityException('New password and confirm password do not match');
        }

        const account = await this.findAccountByEmail(email);

        await this.validateResetToken(account, token);

        const hashedPassword = await this.hashPassword(newPassword);

        const [error] = await this.accountRepository.manager
            .transaction(async transactionalEntityManager => {
                await transactionalEntityManager.update(Account, { id: account.id }, { password: hashedPassword });

                await transactionalEntityManager.update(VerifyToken, { account: { id: account.id } }, { forgotPasswordSecret: '' });

                await transactionalEntityManager.delete(RefreshToken, { account: { id: account.id } });
            })
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        return { message: 'Password has been reset successfully' };
    }

    /**
     * Vì JwtService hiện đã dc config để tự động có secret, vậy nên sẽ không thể dùng được publicKey để verify token.
     * Do đó cần phải khởi tạo thêm 1 đối tượng JwtService mới để verify token với publicKey.
     */
    private async getGoogleUserInfo(body: { code: string; codeVerifier: string }): Promise<GoogleIdTokenDecoded['payload']> {
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

    private async generateAccountTokens(accountEmail: string, accountId: number): Promise<AuthTokenDto> {
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

    private async storeRefreshToken(token: string, accountId: number): Promise<void> {
        const expiresIn = parseInt(this.configService.get('REFRESH_TOKEN_EXPIRES_IN', { infer: true }), 10);
        const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);

        let refreshToken = await this.refreshTokenRepository.findOne({
            where: { account: { id: accountId } },
        });

        if (refreshToken) {
            refreshToken.token = token;
            refreshToken.expiresAt = expiresAt;
        } else {
            refreshToken = this.refreshTokenRepository.create({ token, expiresAt, account: { id: accountId } });
        }

        const [error] = await this.refreshTokenRepository.save(refreshToken).toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    /**
     * Có thể sử dụng mà không cần bắt ngoại lệ.
     */
    private async hashPassword(password: string): Promise<string> {
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

    /**
     * Validate random email OTP with expiration and rate limiting
     */
    async validateRandomEmailOtp(inputOtp: string, account: Account): Promise<boolean> {
        const { verifyToken } = account;

        if (!verifyToken.emailOtpCode || verifyToken.emailOtpCode.trim() === '') {
            throw new UnauthorizedException('No OTP found. Please request a new OTP.');
        }

        if (!verifyToken.emailOtpExpiresAt || new Date() > verifyToken.emailOtpExpiresAt) {
            await this.clearEmailOtp(account.id);
            throw new UnauthorizedException('OTP has expired. Please request a new OTP.');
        }

        if (verifyToken.emailOtpAttempts >= this.otpConfigService.maxEmailOtpAttempts) {
            await this.clearEmailOtp(account.id);
            throw new UnauthorizedException('Too many invalid attempts. Please request a new OTP.');
        }

        if (inputOtp !== verifyToken.emailOtpCode) {
            await this.incrementEmailOtpAttempts(account.id);
            throw new UnauthorizedException('Invalid OTP code');
        }

        return true;
    }

    /**
     * Increment failed email OTP attempts
     */
    private async incrementEmailOtpAttempts(accountId: number): Promise<void> {
        const FIELD_NAME: keyof VerifyToken = 'emailOtpAttempts';
        const [error] = await this.verifyTokenRepository.increment({ account: { id: accountId } }, FIELD_NAME, 1).toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    handleVerifyTotp(token: string, secret: OTPAuth.Secret, accountEmail: string, period: number): boolean {
        const totp = new OTPAuth.TOTP({
            secret,
            label: accountEmail,
            issuer: 'Linker Chat',
            algorithm: this.otpConfigService.algorithm,
            digits: this.otpConfigService.digits,
            period,
        });

        const [error, result] = totp.validate.bind(totp).toSafe({
            window: this.otpConfigService.window,
            token,
        });

        if (error || result === null) {
            const message: string = error instanceof Error ? error.message : 'OTP is invalid or expired';

            throw new UnauthorizedException(message);
        }

        return typeof result === 'number';
    }

    /**
     * Bật tắt toggle email OTP.
     * Reset tất cả dữ liệu liên quan đến email OTP trong mọi trường hợp.
     * các trường dữ liệu cần thiết để gửi email sẽ được khởi tạo tại method storeEmailOtp.
     */
    async handleToggleEmailOtp(account: Account, toggleAction: boolean): Promise<void> {
        const [error] = await this.accountRepository.manager
            .transaction(async transactionalEntityManager => {
                account.enableEmailOtp = toggleAction;

                account.verifyToken.emailOtpCode = null;
                account.verifyToken.emailOtpExpiresAt = null;
                account.verifyToken.emailOtpAttempts = 0;
                await transactionalEntityManager.save(Account, account);
            })
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    /**
     * Store email OTP for a user
     * @param accountId The ID of the user account
     * @param otpCode The OTP code to store
     * @param expiresAt The expiration date of the OTP
     */
    private async storeEmailOtp(accountId: number, otpCode: string, expiresAt: Date): Promise<void> {
        const [error] = await this.verifyTokenRepository
            .update(
                { account: { id: accountId } },
                {
                    emailOtpCode: otpCode,
                    emailOtpExpiresAt: expiresAt,
                    emailOtpAttempts: 0,
                },
            )
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    /**
     * Clear email OTP data
     */
    async clearEmailOtp(accountId: number): Promise<void> {
        const [error] = await this.verifyTokenRepository
            .update(
                { account: { id: accountId } },
                {
                    emailOtpCode: null,
                    emailOtpExpiresAt: null,
                    emailOtpAttempts: 0,
                },
            )
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    /**
     * Generate random 6-digit OTP code
     */
    private generateRandomEmailOtp(): string {
        const min = 100000;
        const max = 999999;

        return Math.floor(Math.random() * (max - min + 1) + min).toString();
    }

    /**
     * Send OTP code via email using Handlebars template
     */
    private async sendOtpEmail(email: string, otpCode: string): Promise<void> {
        const [error, html] = this.generateOtpEmail.bind(this).toSafe(email, otpCode);

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        await this.mailerService.sendMail({
            to: email,
            subject: 'Your OTP Code - Linker Chat',
            html,
        });
    }

    private getEmailTemplate(templateName: string): string {
        const templatePath = join(__dirname, '../assets/email-templates', `${templateName}.html`);

        return readFileSync(templatePath, 'utf-8');
    }

    private generateOtpEmail(email: string, otpCode: string): string {
        const template = this.getEmailTemplate('otp-email');

        return template
            .replace(/{{EMAIL}}/g, email)
            .replace(/{{OTP_CODE}}/g, otpCode)
            .replace(/{{OTP_EXPIRATION}}/g, this.otpConfigService.emailOtpExpirationMinutes);
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

    /**
     * Generate reset token for forgot password
     */
    private generateResetToken(): string {
        return v4().replace(/-/g, '');
    }

    /**
     * Store reset token for password reset
     */
    private async storeResetToken(accountId: number, resetToken: string, expiresAt: Date): Promise<void> {
        const [error] = await this.verifyTokenRepository
            .update(
                { account: { id: accountId } },
                {
                    forgotPasswordSecret: `${resetToken}:${expiresAt.getTime()}:0`,
                },
            )
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    /**
     * Validate reset token
     */
    private async validateResetToken(account: Account, inputToken: string): Promise<void> {
        const { verifyToken } = account;

        if (!verifyToken.forgotPasswordSecret || verifyToken.forgotPasswordSecret.trim() === '') {
            throw new UnauthorizedException('No reset token found. Please request a new password reset.');
        }

        const [storedToken, expiresAtStr, attemptsStr = '0'] = verifyToken.forgotPasswordSecret.split(':');
        const expiresAt = new Date(parseInt(expiresAtStr, 10));
        const attempts = parseInt(attemptsStr, 10);

        if (!storedToken || !expiresAtStr || new Date() > expiresAt) {
            await this.clearResetToken(account.id);
            throw new UnauthorizedException('Reset token has expired. Please request a new password reset.');
        }

        if (attempts >= this.otpConfigService.maxResetPasswordAttempts) {
            await this.clearResetToken(account.id);
            throw new UnauthorizedException('Too many invalid attempts. Please request a new password reset.');
        }

        if (inputToken !== storedToken) {
            await this.incrementResetPasswordAttempts(account.id, storedToken, expiresAt, attempts + 1);
            throw new UnauthorizedException('Invalid or expired reset token');
        }
    }

    /**
     * Clear reset token
     */
    private async clearResetToken(accountId: number): Promise<void> {
        const [error] = await this.verifyTokenRepository
            .update(
                { account: { id: accountId } },
                {
                    forgotPasswordSecret: '',
                },
            )
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    /**
     * Increment failed reset password attempts
     */
    private async incrementResetPasswordAttempts(accountId: number, token: string, expiresAt: Date, attempts: number): Promise<void> {
        const [error] = await this.verifyTokenRepository
            .update(
                { account: { id: accountId } },
                {
                    forgotPasswordSecret: `${token}:${expiresAt.getTime()}:${attempts}`,
                },
            )
            .toSafe();

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }
    }

    /**
     * Send reset password email
     */
    private async sendResetPasswordEmail(email: string, resetToken: string): Promise<void> {
        const baseUrl = this.configService.get('BASE_URL', { infer: true });
        const resetLink = `${baseUrl}/api/auth/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;

        const [error, html] = this.generateResetPasswordEmail.bind(this).toSafe(email, resetToken, resetLink);

        if (error) {
            throw new ServiceUnavailableException(error.message, error.stack);
        }

        await this.mailerService.sendMail({
            to: email,
            subject: 'Reset Your Password - Linker Chat',
            html,
        });
    }

    /**
     * Generate reset password email HTML
     */
    private generateResetPasswordEmail(email: string, resetToken: string, resetLink: string): string {
        const template = this.getEmailTemplate('reset-password');
        const expirationMinutes = this.otpConfigService.resetPasswordExpirationMinutes;

        return template
            .replace(/{{EMAIL}}/g, email)
            .replace(/{{RESET_TOKEN}}/g, resetToken)
            .replace(/{{RESET_LINK}}/g, resetLink)
            .replace(/{{EXPIRATION_MINUTES}}/g, expirationMinutes);
    }
}
