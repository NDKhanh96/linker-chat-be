import { UseFilters } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

import { ReadMessageDto, SendMessageDto, TypingDto } from '~/chat/dto';
import { ChatOrchestrationService } from '~/chat/services';
import type { AuthSocket } from '~/types';
import { WsExceptionFilter } from '~utils/common';

@UseFilters(WsExceptionFilter)
@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatSubscribeGateway {
    constructor(private readonly chatOrchestrationService: ChatOrchestrationService) {}

    @SubscribeMessage('message:send')
    async handleSendMessage(@ConnectedSocket() client: AuthSocket, @MessageBody() payload: SendMessageDto) {
        const accountId = client.data.accountId;

        const message = await this.chatOrchestrationService.sendMessage(accountId, payload);

        return { success: true, message };
    }

    @SubscribeMessage('typing:start')
    handleTypingStart(@ConnectedSocket() client: AuthSocket, @MessageBody() payload: TypingDto) {
        const accountId = client.data.accountId;

        client.to(`conversation:${payload.conversationId}`).emit('typing:start', {
            accountId,
            conversationId: payload.conversationId,
        });
    }

    @SubscribeMessage('typing:stop')
    handleTypingStop(@ConnectedSocket() client: AuthSocket, @MessageBody() payload: TypingDto) {
        const accountId = client.data.accountId;

        client.to(`conversation:${payload.conversationId}`).emit('typing:stop', {
            accountId,
            conversationId: payload.conversationId,
        });
    }

    @SubscribeMessage('message:read')
    handleMessageRead(@ConnectedSocket() client: AuthSocket, @MessageBody() payload: ReadMessageDto) {
        const accountId = client.data.accountId;

        client.to(`conversation:${payload.conversationId}`).emit('message:read', {
            accountId,
            conversationId: payload.conversationId,
            messageId: payload.messageId,
        });
    }

    @SubscribeMessage('conversation:join')
    async handleJoinConversation(@ConnectedSocket() client: AuthSocket, @MessageBody() payload: { conversationId: number }) {
        const accountId = client.data.accountId;

        await this.chatOrchestrationService.joinConversation(accountId, payload.conversationId);

        await client.join(`conversation:${payload.conversationId}`);
    }
}
