import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ChatGateway } from '~/chat/chat.gateway';
import type { EventPayload } from '~utils/common';

@Injectable()
export class ChatEventListener {
    constructor(private readonly gateway: ChatGateway) {}

    // TODO: message:updated, message:deleted
    // TODO: conversation:new, conversation:deleted, conversation:lastMessage
    // TODO: unread:updated

    @OnEvent('message.sent')
    handleMessageSent(payload: EventPayload<'message.sent'>) {
        this.gateway.server.to(`conversation:${payload.conversationId}`).emit('message:receive', payload);
    }
}
