import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateMessageDto } from '~/messages/dto';

export class SendMessageDto extends CreateMessageDto {
    @IsNumber()
    @IsNotEmpty()
    conversationId: number;
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
