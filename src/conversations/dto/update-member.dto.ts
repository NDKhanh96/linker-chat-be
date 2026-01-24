import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateMemberDto {
    @ApiProperty({
        description: 'ID of the last message read by the user',
        example: 123,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    lastReadMessageId?: number;
}
