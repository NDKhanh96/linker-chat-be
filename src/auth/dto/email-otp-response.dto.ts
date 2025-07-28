import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EmailOtpResponseDto {
    @ApiProperty({
        description: 'Success message for email OTP operation',
        example: 'OTP sent to email successfully',
    })
    @Expose()
    message: string;
}
