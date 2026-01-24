import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

import { MessageType } from '~/messages/entities';

export class CreateMessageDto {
    @ApiProperty({
        description: 'Message content',
        example: 'Hello, how are you?',
    })
    @IsString()
    @ValidateIf((o: CreateMessageDto) => o.type === MessageType.TEXT)
    @IsNotEmpty()
    content: string;

    @ApiProperty({
        enum: MessageType,
        description: 'Type of message',
        example: MessageType.TEXT,
        default: MessageType.TEXT,
    })
    @IsEnum(MessageType)
    @IsOptional()
    type?: MessageType;

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
