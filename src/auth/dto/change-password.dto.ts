import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { ResetPasswordDto } from '~/auth/dto';

export class ChangePasswordDto extends PickType(ResetPasswordDto, ['newPassword', 'confirmPassword'] as const) {
    @ApiProperty({ example: 'OldPassword123!', description: 'Current password' })
    @IsString()
    @IsNotEmpty()
    oldPassword: string;
}
