import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordRequestDTO {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
