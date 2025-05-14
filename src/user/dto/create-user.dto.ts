import { ApiProperty } from '@nestjs/swagger';

import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    firstName: string = '';

    @ApiProperty()
    @IsOptional()
    @IsString()
    lastName: string = '';

    @ApiProperty()
    @IsOptional()
    @IsString()
    avatar: string = '';

    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    confirmPassword: string;
}
