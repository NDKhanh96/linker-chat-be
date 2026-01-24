import { ApiProperty } from '@nestjs/swagger';

import { Conversation } from '~/conversations/entities';
import { OffsetPaginationResponseDto, type OffsetPaginationMetaDto } from '~utils/common';

export class ConversationOffsetPaginationResponseDto extends OffsetPaginationResponseDto<Conversation> {
    @ApiProperty({ type: () => Conversation, isArray: true })
    data: Conversation[];

    constructor(data: Conversation[], meta: OffsetPaginationMetaDto) {
        super(data, meta);
        this.data = data;
    }
}
