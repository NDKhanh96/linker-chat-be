import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { AuthTokenDto } from '~/auth/dto/auth-token.dto';

export class EmailOtpValidationResponseDto {
    @ApiProperty({
        description: 'Whether the email OTP is valid',
        example: true,
    })
    @Expose()
    verified: boolean;

    @ApiProperty({
        description: 'Authentication token if requested',
        type: AuthTokenDto,
        required: false,
    })
    @Expose()
    authToken?: AuthTokenDto;
}
