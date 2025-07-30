import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ValidateEmailOtpDto {
    @ApiProperty({
        description: 'Email address associated with the OTP',
        example: 'user@example.com',
    })
    @IsNotEmpty({ message: 'Email address is required' })
    @IsString({ message: 'Email address must be a string' })
    @Length(6, 100, { message: 'Email address must be between 6 and 100 characters' })
    email: string;

    @ApiProperty({
        description: 'OTP code sent to email',
        example: '123456',
        minLength: 6,
        maxLength: 6,
        pattern: '^[0-9]{6}$',
    })
    @IsNotEmpty({ message: 'OTP code is required' })
    @IsString({ message: 'OTP code must be a string' })
    @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
    @Matches(/^[0-9]{6}$/, { message: 'OTP code must contain only digits' })
    token: string;

    @ApiProperty({
        description: 'Flag to indicate whether to return authentication tokens',
        example: true,
        required: false,
    })
    @IsBoolean({ message: 'getAuthTokens must be a boolean' })
    getAuthTokens?: boolean;
}
