import { ApiProperty } from '@nestjs/swagger';

export class TotpSecretResponseDto {
    @ApiProperty({
        description: 'The secret key for TOTP setup (base32 encoded)',
        // cspell:disable-next-line
        example: 'JBSWY3DPEHPK3PXP',
        type: String,
    })
    secret: string;
}

export class TotpValidationResponseDto {
    @ApiProperty({
        description: 'Whether the TOTP token is valid',
        example: true,
        type: Boolean,
    })
    verified: boolean;
}
