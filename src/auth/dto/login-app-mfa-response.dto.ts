import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginAppMfaResDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    validateAppMFA: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;
}
