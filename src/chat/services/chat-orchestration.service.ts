import { Injectable } from '@nestjs/common';
import type { SendMessageDto } from '~/chat/dto';
import { ConversationsService } from '~/conversations/conversations.service';
import { MessagesService } from '~/messages/messages.service';

@Injectable()
export class ChatOrchestrationService {
    constructor(
        private readonly messagesService: MessagesService,
        private readonly conversationsService: ConversationsService,
    ) {}

    async sendMessage(accountId: number, payload: SendMessageDto) {
        return await this.messagesService.sendMessage(payload.conversationId, accountId, {
            content: payload.content,
            attachmentIds: payload.attachmentIds,
            replyToId: payload.replyToId,
        });
    }

    async joinConversation(accountId: number, conversationId: number) {
        return await this.conversationsService.findOne(conversationId, accountId);
    }
}
