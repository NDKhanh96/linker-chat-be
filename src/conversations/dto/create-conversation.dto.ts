import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ConversationType } from '~/conversations/entities';

export class CreateConversationDto {
    @ApiProperty({
        enum: ConversationType,
        description: 'Type of conversation: direct or group',
        example: ConversationType.DIRECT,
    })
    @IsEnum(ConversationType)
    @IsNotEmpty()
    type: ConversationType;

    @ApiProperty({
        description: 'Title for group conversation (required for GROUP type)',
        example: 'Team Discussion',
        required: false,
    })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({
        description: 'Avatar URL for group conversation',
        example: 'https://example.com/avatar.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    avatar?: string;

    @ApiProperty({
        description: 'Description for group conversation',
        example: 'This is our team discussion group',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'Array of user IDs to add as members. For DIRECT: 1 user, for GROUP: multiple users',
        example: [2, 3, 4],
        type: [Number],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsNotEmpty()
    memberIds: number[];
}
