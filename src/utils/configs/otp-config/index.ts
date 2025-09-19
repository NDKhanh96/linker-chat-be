import { Injectable } from '@nestjs/common';

export interface OtpConfigOptions {
    algorithm: string;
    digits: number;
    totpPeriod: number;
    emailOtpTtlMs: number;
    emailOtpResendCooldownMs: number;
    maxEmailOtpAttempts: number;
    resetPasswordTtlMs: number;
    resetPasswordResendCooldownMs: number;
    maxResetPasswordAttempts: number;
    window: number;
}

@Injectable()
export class OtpConfigService {
    private readonly config: OtpConfigOptions;

    constructor() {
        this.config = {
            algorithm: 'SHA1',
            digits: 6,
            totpPeriod: 30,
            emailOtpTtlMs: 15 * 60 * 1000,
            emailOtpResendCooldownMs: 60 * 1000,
            maxEmailOtpAttempts: 5,
            resetPasswordTtlMs: 15 * 60 * 1000,
            resetPasswordResendCooldownMs: 60 * 1000,
            maxResetPasswordAttempts: 5,
            /**
             * window: 1 để cho phép mã OTP có thể được sử dụng trước hoặc sau thời gian hiện tại 1 đơn vị thời gian.
             * tránh việc độ trễ mạng cao hoặc máy chủ chậm khiến mã OTP không hợp lệ.
             */
            window: 1,
        };
    }

    get algorithm(): string {
        return this.config.algorithm;
    }

    get digits(): number {
        return this.config.digits;
    }

    get totpPeriod(): number {
        return this.config.totpPeriod;
    }

    get emailOtpTtlMs(): number {
        return this.config.emailOtpTtlMs;
    }

    get resetPasswordTtlMs(): number {
        return this.config.resetPasswordTtlMs;
    }

    get emailOtpResendCooldownMs(): number {
        return this.config.emailOtpResendCooldownMs;
    }

    get maxEmailOtpAttempts(): number {
        return this.config.maxEmailOtpAttempts;
    }

    get resetPasswordResendCooldownMs(): number {
        return this.config.resetPasswordResendCooldownMs;
    }

    get maxResetPasswordAttempts(): number {
        return this.config.maxResetPasswordAttempts;
    }

    get window(): number {
        return this.config.window;
    }

    get emailOtpExpirationMinutes(): string {
        return (this.emailOtpTtlMs / (60 * 1000)).toString();
    }

    get resetPasswordExpirationMinutes(): string {
        return (this.resetPasswordTtlMs / (60 * 1000)).toString();
    }
}
