import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
    @ApiProperty({
        description: 'Message content',
        example: 'Hello, how are you?',
    })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({
        description: 'ID of the message being replied to',
        example: 123,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    replyToId?: number;

    @ApiProperty({
        description: 'Array of attachment IDs',
        example: [1, 2, 3],
        required: false,
        type: [Number],
    })
    @IsOptional()
    attachmentIds?: number[];

    @ApiProperty({
        description: 'Vì FE sẽ cache bằng optimistic nên sẽ phải gửi thêm tempId để client nhận biết dc response nào tương ứng với cache nào để update',
        example: '2026-04-14T07:19:04.000Z_53',
        required: true,
    })
    @IsNumber()
    tempId: number;
}
