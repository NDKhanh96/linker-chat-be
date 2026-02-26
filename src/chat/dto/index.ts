import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
    @IsNumber()
    @IsNotEmpty()
    conversationId: number;

    @IsString()
    @IsNotEmpty()
    content?: string;

    @IsNumber()
    @IsOptional()
    replyToId?: number;

    @IsNumber({}, { each: true })
    @IsOptional()
    attachmentIds?: number[];
}

export class TypingDto {
    @IsNumber()
    @IsNotEmpty()
    conversationId: number;
}

export class ReadMessageDto {
    @IsNumber()
    @IsNotEmpty()
    conversationId: number;

    @IsNumber()
    @IsNotEmpty()
    messageId: number;
}

export class JoinConversationDto {
    @IsNumber()
    @IsNotEmpty()
    conversationId: number;
}
