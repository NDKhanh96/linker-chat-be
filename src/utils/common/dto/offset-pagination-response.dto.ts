import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { OffsetPaginationMetaDto } from '~utils/common/dto';

export class OffsetPaginationResponseDto<T> {
    @ApiProperty({
        description: 'Data array for offset pagination',
        isArray: true,
    })
    @Expose()
    data: T[];

    @ApiProperty({ type: OffsetPaginationMetaDto })
    @Expose()
    meta: OffsetPaginationMetaDto;

    constructor(data: T[], meta: OffsetPaginationMetaDto) {
        this.data = data;
        this.meta = meta;
    }
}
