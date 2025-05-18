import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService } from '~/auth/auth.service';
import { CreateAccountDto } from '~/auth/dto';
import type { Account } from '~/auth/entities';

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

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.authService.findOne(+id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.authService.remove(+id);
    }
}
