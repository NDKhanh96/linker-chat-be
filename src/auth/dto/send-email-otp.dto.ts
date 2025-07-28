import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SendEmailOtpDto {
    @ApiProperty({
        description: 'Enable or disable email OTP',
        example: true,
        type: 'boolean',
    })
    @IsBoolean()
    enable: boolean;
}
