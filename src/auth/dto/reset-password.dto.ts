import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ description: 'Email address' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Reset token from email' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ description: 'New password', minLength: 6 })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    newPassword: string;

    @ApiProperty({ description: 'Confirm new password' })
    @IsString()
    @MinLength(6)
    confirmPassword: string;
}
