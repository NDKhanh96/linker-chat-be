import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EmailOtpValidationResponseDto {
    @ApiProperty({
        description: 'Whether the email OTP is valid',
        example: true,
    })
    @Expose()
    verified: boolean;
}
