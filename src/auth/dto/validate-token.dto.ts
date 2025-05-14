import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateTokenDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    token: string;
}
