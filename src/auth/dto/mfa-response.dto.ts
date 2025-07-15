import { ApiProperty } from '@nestjs/swagger';

export class MfaSecretResponseDto {
    @ApiProperty({
        description: 'The secret key for MFA setup (base32 encoded)',
        // cspell:disable-next-line
        example: 'JBSWY3DPEHPK3PXP',
        type: String,
    })
    secret: string;
}

export class MfaValidationResponseDto {
    @ApiProperty({
        description: 'Whether the MFA token is valid',
        example: true,
        type: Boolean,
    })
    verified: boolean;
}
