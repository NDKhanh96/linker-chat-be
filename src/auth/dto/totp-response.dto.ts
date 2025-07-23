import { ApiProperty } from '@nestjs/swagger';

export class TotpSecretResponseDto {
    @ApiProperty()
    secret: string;
}

export class TotpValidationResponseDto {
    @ApiProperty()
    verified: boolean;
}
