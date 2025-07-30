import { ApiProperty } from '@nestjs/swagger';

import type { AuthTokenDto } from '~/auth/dto/auth-token.dto';

export class TotpSecretResponseDto {
    @ApiProperty()
    secret: string;
}

export class TotpValidationResponseDto {
    @ApiProperty()
    verified: boolean;

    @ApiProperty()
    authToken?: AuthTokenDto;
}
