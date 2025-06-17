import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiExcludeEndpoint, ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';

import { AuthService } from '~/auth/auth.service';
import { CreateAccountDto, LoginAppMfaResDto, LoginDto, LoginJwtResDto } from '~/auth/dto';
import type { Account } from '~/auth/entities';
import type { LoginResponse, QueryGoogleAuth, QueryGoogleCallback } from '~/types';
import { ApiResponseOneOf } from '~utils/decorator';

@ApiOAuth2(['profile', 'email'], 'oauth2')
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiBody({ type: CreateAccountDto })
    @ApiOperation({ summary: 'User register' })
    @ApiResponse({ status: 201, description: 'Signup successful' })
    @ApiResponse({ status: 401, description: 'Signup failed' })
    async register(@Body() body: CreateAccountDto): Promise<Account> {
        return await this.authService.register(body);
    }

    @Post('login')
    @HttpCode(200)
    @ApiBody({ type: LoginDto })
    @ApiOperation({ summary: 'User login' })
    @ApiResponseOneOf({ status: 200, description: 'Login response', models: [LoginJwtResDto, LoginAppMfaResDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async login(@Body() loginDTO: LoginDto): Promise<LoginResponse> {
        return await this.authService.login(loginDTO);
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
    async googleLogin(@Body() body: { code: string; codeVerifier: string }): Promise<LoginResponse> {
        return this.authService.googleLogin(body);
    }
}
