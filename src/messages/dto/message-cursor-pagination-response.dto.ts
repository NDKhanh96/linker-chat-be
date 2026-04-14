import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { Message } from '~/messages/entities';
import { User } from '~/user/entities';
import { CursorPaginationResponseDto, type CursorPaginationMetaDto } from '~utils/common';

class UserNoAccountDto extends OmitType(User, ['account'] as const) {}

export class MessageResponseDto extends OmitType(Message, ['sender'] as const) {
    @ApiProperty({ type: () => UserNoAccountDto })
    @Type(() => UserNoAccountDto)
    sender: UserNoAccountDto;
}

export class MessagesCursorPaginationResponseDto extends CursorPaginationResponseDto<MessageResponseDto> {
    @ApiProperty({ type: () => MessageResponseDto, isArray: true })
    @Type(() => MessageResponseDto)
    data: MessageResponseDto[];

    constructor(data: MessageResponseDto[], meta: CursorPaginationMetaDto) {
        super(data, meta);
        this.data = data;
    }
}
