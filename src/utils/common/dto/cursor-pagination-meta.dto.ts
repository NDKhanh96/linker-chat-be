import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CursorPaginationMetaDto {
    @ApiProperty({
        example: 'abc123',
        nullable: true,
        description: 'Cursor for fetching the next page',
    })
    @Expose()
    nextCursor: string | null;

    @ApiProperty({
        example: true,
        description: 'Whether more data is available',
    })
    @Expose()
    hasMore: boolean;

    @ApiProperty({
        example: 20,
        description: 'Number of items returned in the current page',
    })
    @Expose()
    limit: number;
}
