import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ForgotPasswordResponseDto {
    @ApiProperty({ description: 'Success message' })
    @Expose()
    message: string;
}
