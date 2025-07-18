import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTotpTokenDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string;
}
