import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { CursorPaginationMetaDto } from '~utils/common/dto';

export class CursorPaginationResponseDto<T> {
    @ApiProperty({
        description: 'Data array for cursor pagination',
        isArray: true,
    })
    @Expose()
    data: T[];

    @ApiProperty({ type: CursorPaginationMetaDto })
    @Expose()
    meta: CursorPaginationMetaDto;

    constructor(data: T[], meta: CursorPaginationMetaDto) {
        this.data = data;
        this.meta = meta;
    }
}
