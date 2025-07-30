import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';

import { AuthService } from '~/auth/auth.service';
import {
    AuthTokenDto,
    CreateAccountDto,
    EmailOtpResponseDto,
    EmailOtpValidationResponseDto,
    LoginCredentialResDto,
    LoginDto,
    RefreshTokenDto,
    SendEmailOtpDto,
    ToggleTotpDto,
    TotpSecretResponseDto,
    TotpValidationResponseDto,
    ValidateEmailOtpDto,
    ValidateTotpTokenDTO,
} from '~/auth/dto';
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
    @ApiBearerAuth()
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
    @ApiBearerAuth()
    @ApiBody({ type: ValidateEmailOtpDto })
    @ApiOperation({ summary: 'Validate OTP code sent to email' })
    @ApiResponse({ status: 200, description: 'Email OTP validation successful', type: EmailOtpValidationResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    validateEmailOtp(@Body() validateOtpDto: ValidateEmailOtpDto): Promise<EmailOtpValidationResponseDto> {
        return this.authService.validateEmailOtpToken(validateOtpDto);
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
}
