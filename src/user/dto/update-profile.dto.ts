import { PickType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

import { CreateAccountDto } from '~/auth/dto';

export class UpdateProfileDto extends PickType(CreateAccountDto, ['firstName', 'lastName'] as const) {
    @ApiProperty({ required: false, description: 'Base64 image or URL' })
    @IsOptional()
    @IsString()
    @Matches(/^(data:image\/|http)/, {
        message: 'avatar must be base64 image or url',
    })
    avatar?: string;
}
