import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendEmailDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
