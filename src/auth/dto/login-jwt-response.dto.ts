import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

import { AuthTokenDto } from '~/auth/dto';

export class LoginJwtResDto {
    @ApiProperty({ type: AuthTokenDto })
    @Expose()
    @ValidateNested()
    @Type(() => AuthTokenDto)
    authToken: AuthTokenDto;

    @ApiProperty()
    @Expose()
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @Expose()
    @IsBoolean()
    @IsNotEmpty()
    enableAppMfa: boolean;

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
