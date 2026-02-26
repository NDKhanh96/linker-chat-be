import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
    @ApiProperty({
        description: 'Message content',
        example: 'Hello, how are you?',
    })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({
        description: 'ID of the message being replied to',
        example: 123,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    replyToId?: number;

    @ApiProperty({
        description: 'Array of attachment IDs',
        example: [1, 2, 3],
        required: false,
        type: [Number],
    })
    @IsOptional()
    attachmentIds?: number[];
}
