import { Logger, UseFilters } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { ChatConnectionService } from '~/chat/services';
import type { AuthServer, AuthSocket } from '~/types';
import { WsExceptionFilter } from '~utils/common';

// TODO: unread:updated
// TODO: message:updated, message:deleted
// TODO: conversation:new, conversation:deleted, conversation:lastMessage
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

    constructor(private readonly chatConnectionService: ChatConnectionService) {}

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
}
