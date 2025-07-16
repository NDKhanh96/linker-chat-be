import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleTotpDto {
    @ApiProperty({
        description: 'Toggle authenticator TOTP on or off',
        example: true,
        type: Boolean,
    })
    @IsBoolean()
    toggle: boolean;
}
