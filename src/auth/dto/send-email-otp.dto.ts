import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SendEmailOtpDto {
    @ApiProperty({
        description: 'Enable or disable email OTP',
        example: true,
        type: 'boolean',
    })
    @IsBoolean({ message: 'enable must be a boolean value' })
    @IsNotEmpty({ message: 'enable field is required' })
    enable: boolean;
}
