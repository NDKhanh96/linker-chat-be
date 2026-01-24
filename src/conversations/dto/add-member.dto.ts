import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { ConversationRole } from '~/conversations/entities';

export class AddMemberDto {
    @ApiProperty({
        description: 'Array of user IDs to add to the conversation',
        example: [2, 3, 4],
        type: [Number],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsNotEmpty()
    userIds: number[];

    @ApiProperty({
        enum: ConversationRole,
        description: 'Role for the new members',
        example: ConversationRole.MEMBER,
        default: ConversationRole.MEMBER,
        required: false,
    })
    @IsEnum(ConversationRole)
    @IsOptional()
    role?: ConversationRole;
}
