import { Test, TestingModule } from '@nestjs/testing';

import { OtpConfigService } from '~utils/configs/otp-config';

describe('OtpConfigService', () => {
    let otpConfig: OtpConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [OtpConfigService],
        }).compile();

        otpConfig = module.get<OtpConfigService>(OtpConfigService);
    });

    it('should be defined', () => {
        expect(otpConfig).toBeDefined();
    });

    it('should return correct algorithm', () => {
        expect(otpConfig.algorithm).toBe('SHA1');
    });

    it('should return correct digits', () => {
        expect(otpConfig.digits).toBe(6);
    });

    it('should return correct TOTP period', () => {
        expect(otpConfig.totpPeriod).toBe(30);
    });

    it('should return correct email OTP TTL', () => {
        expect(otpConfig.emailOtpTtlMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should return correct max email OTP attempts', () => {
        expect(otpConfig.maxEmailOtpAttempts).toBe(5);
    });

    it('should return correct window', () => {
        expect(otpConfig.window).toBe(1);
    });

    it('should return correct email OTP expiration minutes', () => {
        expect(otpConfig.emailOtpExpirationMinutes).toBe('15');
    });

    it('should return 60 seconds cooldown for non-test environment', () => {
        // Mock process.env.NODE_ENV = 'production'
        const originalEnv = process.env.NODE_ENV;

        process.env.NODE_ENV = 'production';

        // Create new instance to test environment-specific behavior
        const prodOtpConfig = new OtpConfigService();

        expect(prodOtpConfig.emailOtpResendCooldownMs).toBe(60 * 1000);

        // Restore original environment
        process.env.NODE_ENV = originalEnv;
    });
});
