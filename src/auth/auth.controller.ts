import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';
import { join } from 'path';

import { AuthService } from '~/auth/auth.service';
import {
    AuthTokenDto,
    CreateAccountDto,
    EmailOtpResponseDto,
    EmailOtpValidationResponseDto,
    ForgotPasswordRequestDTO,
    ForgotPasswordResponseDto,
    LoginCredentialResDto,
    LoginDto,
    RefreshTokenDto,
    ResendEmailDto,
    ResetPasswordDto,
    ResetPasswordResponseDto,
    SendEmailOtpDto,
    ToggleTotpDto,
    TotpSecretResponseDto,
    TotpValidationResponseDto,
    ValidateEmailOtpDto,
    ValidateTotpTokenDTO,
} from '~/auth/dto';
import { ChangePasswordDto } from '~/auth/dto/change-password.dto';
import { Account } from '~/auth/entities';
import type { QueryGoogleAuth, QueryGoogleCallback } from '~/types';
import { ApiResponseOneOf } from '~utils/decorator';

@ApiOAuth2(['profile', 'email'], 'oauth2')
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiBody({ type: CreateAccountDto })
    @ApiOperation({ summary: 'User register' })
    @ApiResponse({ status: 201, description: 'Signup successful', type: Account })
    @ApiResponse({ status: 401, description: 'Signup failed' })
    async register(@Body() body: CreateAccountDto): Promise<Account> {
        return await this.authService.register(body);
    }

    @Post('login')
    @HttpCode(200)
    @ApiBody({ type: LoginDto })
    @ApiOperation({ summary: 'User login' })
    @ApiResponseOneOf({ status: 200, description: 'Login response', models: [LoginCredentialResDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() loginDTO: LoginDto): Promise<LoginCredentialResDto> {
        return await this.authService.login(loginDTO);
    }

    @Post('refresh')
    @HttpCode(200)
    @ApiBody({ type: RefreshTokenDto })
    @ApiOperation({ summary: 'Generate new token by refresh token' })
    @ApiResponse({ status: 200, description: 'Refresh token successful', type: AuthTokenDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthTokenDto> {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Post('totp/toggle')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiBody({ type: ToggleTotpDto })
    @ApiOperation({ summary: 'Toggle authenticator app on or off' })
    @ApiResponse({ status: 200, description: 'Toggle 2 factor authentication successful', type: TotpSecretResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    toggleTotp(@Req() req: Express.AuthenticatedRequest, @Body() body: ToggleTotpDto): Promise<TotpSecretResponseDto> {
        return this.authService.toggleTotp(req.user.id, body.toggle);
    }

    @Post('totp/validate')
    @HttpCode(200)
    @ApiOperation({ summary: 'Validate totp by code in authenticator app' })
    @ApiResponse({ status: 200, description: 'Validate 2 factor authentication successful', type: TotpValidationResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    validateTotpToken(@Body() validateTokenDTO: ValidateTotpTokenDTO): Promise<TotpValidationResponseDto> {
        return this.authService.validateTotpToken(validateTokenDTO);
    }

    @Post('email-otp/toggle')
    @UseGuards(AuthGuard('jwt'))
    @HttpCode(200)
    @ApiBearerAuth()
    @ApiBody({ type: SendEmailOtpDto })
    @ApiOperation({ summary: 'Send OTP to email or disable email OTP' })
    @ApiResponse({ status: 200, description: 'Email OTP operation successful', type: EmailOtpResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    toggleEmailOtp(@Req() req: Express.AuthenticatedRequest, @Body() body: SendEmailOtpDto): Promise<EmailOtpResponseDto> {
        return this.authService.toggleEmailOtp(req.user.id, body.enable);
    }

    @Post('email-otp/validate')
    @HttpCode(200)
    @ApiBody({ type: ValidateEmailOtpDto })
    @ApiOperation({ summary: 'Validate OTP code sent to email' })
    @ApiResponse({ status: 200, description: 'Email OTP validation successful', type: EmailOtpValidationResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    validateEmailOtp(@Body() validateOtpDto: ValidateEmailOtpDto): Promise<EmailOtpValidationResponseDto> {
        return this.authService.validateEmailOtpToken(validateOtpDto);
    }

    @Post('email-otp/resend')
    @HttpCode(200)
    @ApiBody({ type: ResendEmailDto, description: 'Email address to resend OTP' })
    @ApiOperation({ summary: 'Resend OTP code to email' })
    @ApiResponse({ status: 200, description: 'Email OTP resent successfully', type: EmailOtpResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    resendEmailOtp(@Body() resendOtpDto: ResendEmailDto): Promise<EmailOtpResponseDto> {
        return this.authService.resendEmailOtp(resendOtpDto.email);
    }

    @Get('social/login')
    @ApiExcludeEndpoint()
    socialLogin(@Res() res: Response, @Query() query: QueryGoogleAuth): void {
        return this.authService.socialLogin(res, query);
    }

    @Get('google/callback')
    @ApiExcludeEndpoint()
    googleCallback(@Res() res: Response, @Query() query: QueryGoogleCallback): void {
        return this.authService.googleCallback(res, query);
    }

    @Post('google/login')
    @ApiExcludeEndpoint()
    async googleLogin(@Body() body: { code: string; codeVerifier: string }): Promise<LoginCredentialResDto> {
        return this.authService.googleLogin(body);
    }

    @Post('forgot-password')
    @HttpCode(200)
    @ApiBody({ type: ForgotPasswordRequestDTO })
    @ApiOperation({ summary: 'Send reset password email' })
    @ApiResponse({ status: 200, description: 'Password reset instructions have been sent to your email', type: ForgotPasswordResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async forgotPassword(@Body() body: ForgotPasswordRequestDTO): Promise<ForgotPasswordResponseDto> {
        return this.authService.forgotPassword(body.email);
    }

    @Get('reset-password')
    @ApiExcludeEndpoint()
    getResetPasswordPage(@Res() res: Response) {
        const filePath = join(__dirname, '../assets/web-template/reset-password.html');

        res.sendFile(filePath);
    }

    @Post('reset-password')
    @HttpCode(200)
    @ApiBody({ type: ResetPasswordDto })
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiResponse({ status: 200, description: 'Password reset successful', type: ResetPasswordResponseDto })
    @ApiResponse({ status: 401, description: 'Invalid or expired reset token' })
    @ApiResponse({ status: 422, description: 'Passwords do not match' })
    async resetPassword(@Body() body: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
        return this.authService.resetPassword(body);
    }

    @Post('change-password')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: ChangePasswordDto })
    @ApiOperation({ summary: 'Change password' })
    @ApiResponse({ status: 200, description: 'Change password successful', type: ResetPasswordResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 422, description: 'Passwords do not match' })
    async changePassword(@Req() req: Express.AuthenticatedRequest, @Body() body: ChangePasswordDto): Promise<ResetPasswordResponseDto> {
        return this.authService.changePassword(req.user.id, body);
    }
}
