import { ApiProperty } from '@nestjs/swagger';

import { Conversation } from '~/conversations/entities';
import { CursorPaginationResponseDto, type CursorPaginationMetaDto } from '~utils/common';

export class ConversationCursorPaginationResponseDto extends CursorPaginationResponseDto<Conversation> {
    @ApiProperty({ type: () => Conversation, isArray: true })
    data: Conversation[];

    constructor(data: Conversation[], meta: CursorPaginationMetaDto) {
        super(data, meta);
        this.data = data;
    }
}
