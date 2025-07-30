import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ValidateTotpTokenDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty()
    @IsBoolean()
    getAuthTokens?: boolean;
}
