import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ValidateTotpTokenDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    getAuthTokens?: boolean;
}
