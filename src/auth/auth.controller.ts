import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiExcludeEndpoint, ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from '~/auth/auth.service';
import { CreateAccountDto, LoginAppMfaResDto, LoginDto, LoginJwtResDto } from '~/auth/dto';
import type { Account } from '~/auth/entities';
import type { LoginResponse } from '~/types';
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

    @Get('google/login')
    @UseGuards(AuthGuard('google'))
    @ApiExcludeEndpoint()
    async goToGoogleLogin(): Promise<void> {}

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    @ApiExcludeEndpoint()
    async googleLogin(@Req() req: Express.Request): Promise<LoginResponse> {
        return await this.authService.googleLogin(req);
    }
}
