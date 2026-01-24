import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMessageDto {
    @ApiProperty({
        description: 'Updated message content',
        example: 'Updated message text',
    })
    @IsString()
    @IsNotEmpty()
    content: string;
}
