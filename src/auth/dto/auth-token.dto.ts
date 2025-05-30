import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthTokenDto {
    @ApiProperty()
    @Expose()
    @IsString()
    @IsNotEmpty()
    accessToken: string;

    @ApiProperty()
    @Expose()
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
