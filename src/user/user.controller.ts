import { Body, Controller, Get, HttpCode, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import type { AuthenticatedMockRequest } from '~/types';
import { UpdateProfileDto } from '~/user/dto';
import { UserService } from '~/user/user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'find all users' })
    @ApiResponse({ status: 200, description: 'Find all users successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.userService.findAll();
    }

    @Get('profile')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'get profile of user' })
    @ApiResponse({ status: 200, description: 'Get profile of user successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getProfile(@Req() req: AuthenticatedMockRequest) {
        return this.userService.findOne(req.user.id);
    }

    @Get(':id')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'find user by id' })
    @ApiResponse({ status: 200, description: 'Find user by id successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Param('id') id: string) {
        return this.userService.findOne(+id);
    }

    @Patch('profile')
    @HttpCode(200)
    @UseGuards(AuthGuard('jwt'))
    @ApiBody({ type: UpdateProfileDto })
    @ApiBearerAuth()
    @ApiOperation({ summary: 'update profile' })
    @ApiResponse({ status: 200, description: 'update profile successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    updateProfile(@Req() req: AuthenticatedMockRequest, @Body() updateUserDto: UpdateProfileDto) {
        return this.userService.update(req.user.id, updateUserDto);
    }
}
