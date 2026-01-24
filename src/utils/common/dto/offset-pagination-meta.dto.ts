import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OffsetPaginationMetaDto {
    @ApiProperty({ example: 1 })
    @Expose()
    page: number;

    @ApiProperty({ example: 10 })
    @Expose()
    limit: number;

    @ApiProperty({ example: 100 })
    @Expose()
    total: number;

    @ApiProperty({ example: 10 })
    @Expose()
    totalPages: number;

    @ApiProperty({ example: true })
    @Expose()
    hasNextPage: boolean;

    @ApiProperty({ example: false })
    @Expose()
    hasPrevPage: boolean;
}
