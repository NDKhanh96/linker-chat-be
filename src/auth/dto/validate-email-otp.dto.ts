import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ValidateEmailOtpDto {
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
}
