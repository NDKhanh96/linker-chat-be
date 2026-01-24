import { ApiProperty } from '@nestjs/swagger';

import { Message } from '~/messages/entities';
import { CursorPaginationResponseDto, type CursorPaginationMetaDto } from '~utils/common';

export class MessagesCursorPaginationResponseDto extends CursorPaginationResponseDto<Message> {
    @ApiProperty({ type: () => Message, isArray: true })
    data: Message[];

    constructor(data: Message[], meta: CursorPaginationMetaDto) {
        super(data, meta);
        this.data = data;
    }
}
