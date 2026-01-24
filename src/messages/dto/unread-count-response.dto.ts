import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountResponseDto {
    @ApiProperty({
        description: 'Total number of unread messages across all conversations',
        example: 15,
    })
    total: number;

    @ApiProperty({
        description: 'Number of unread messages per conversation (conversationId -> count)',
        example: { '1': 5, '2': 10 },
        type: 'object',
        additionalProperties: {
            type: 'number',
        },
    })
    byConversation: Record<number, number>;

    constructor(total: number, byConversation: Record<number, number>) {
        this.total = total;
        this.byConversation = byConversation;
    }
}
