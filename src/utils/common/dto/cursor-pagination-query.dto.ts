import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CursorPaginationQueryDto {
    @ApiProperty({
        description: 'Cursor for pagination (message ID)',
        example: 123,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    cursor?: string;

    @ApiProperty({
        description: 'Number of items to fetch',
        example: 20,
        default: 20,
        minimum: 1,
        maximum: 100,
        required: false,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
