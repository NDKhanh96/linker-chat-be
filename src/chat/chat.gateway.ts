import { Logger, UseFilters } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';

import { ReadMessageDto, SendMessageDto, TypingDto } from '~/chat/dto';
import { ChatConnectionService, ChatOrchestrationService } from '~/chat/services';
import type { AuthServer, AuthSocket } from '~/types';
import { WsExceptionFilter } from '~utils/common';

@UseFilters(WsExceptionFilter)
@WebSocketGateway({
    cors: {
        origin: '*',
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: AuthServer;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly chatConnectionService: ChatConnectionService,
        private readonly chatOrchestrationService: ChatOrchestrationService,
    ) {}

    afterInit(server: AuthServer) {
        server.use(this.chatConnectionService.createMiddleware());
    }

    async handleConnection(client: AuthSocket) {
        try {
            await this.chatConnectionService.handleConnect(this.server, client);
        } catch (error) {
            this.logger.error(error instanceof Error ? error.message : 'Handle connection WebSocket error');
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        try {
            this.chatConnectionService.handleDisconnect(this.server, client);
        } catch (error) {
            this.logger.error(error instanceof Error ? error.message : 'Handle disconnect WebSocket error');
        }
    }

    @SubscribeMessage('message:send')
    async handleSendMessage(@ConnectedSocket() client: AuthSocket, @MessageBody() payload: SendMessageDto) {
        const accountId = client.data.accountId;

        const message = await this.chatOrchestrationService.sendMessage(accountId, payload);

        this.server.to(`conversation:${payload.conversationId}`).emit('message:receive', {
            message,
            conversationId: payload.conversationId,
        });

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

        this.logger.log(`User ${accountId} joined conversation ${payload.conversationId}`);
    }
}
