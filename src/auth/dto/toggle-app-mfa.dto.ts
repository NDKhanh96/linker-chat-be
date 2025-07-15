import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleAppMfaDto {
    @ApiProperty({
        description: 'Toggle authenticator app MFA on or off',
        example: true,
        type: Boolean,
    })
    @IsBoolean()
    toggle: boolean;
}
