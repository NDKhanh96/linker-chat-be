import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';

import { AuthTokenDto } from '~/auth/dto';

export class LoginCredentialResDto {
    @ApiProperty({ type: AuthTokenDto })
    @Expose()
    @ValidateNested()
    @Type(() => AuthTokenDto)
    authToken: AuthTokenDto | undefined;

    @ApiProperty()
    @Expose()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @Expose()
    @IsBoolean()
    @IsNotEmpty()
    enableTotp: boolean;

    @ApiProperty()
    @Expose()
    @IsBoolean()
    @IsNotEmpty()
    enableEmailOtp: boolean;

    @ApiProperty()
    @Expose()
    @IsBoolean()
    @IsNotEmpty()
    isCredential: boolean;

    @ApiProperty()
    @Expose()
    @IsNumber()
    @IsNotEmpty()
    id: number;
}
