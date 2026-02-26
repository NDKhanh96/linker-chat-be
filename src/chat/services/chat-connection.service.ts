import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createSocketAuthMiddleware } from '~/chat/ws-middlewares';
import { ConversationsService } from '~/conversations/conversations.service';
import type { AuthServer, AuthSocket } from '~/types';

@Injectable()
export class ChatConnectionService {
    /**
     * Track sockets per user
     */
    private userSockets = new Map<number, Set<string>>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly conversationsService: ConversationsService,
    ) {}

    createMiddleware() {
        return createSocketAuthMiddleware(this.jwtService, new Logger('ChatSocketAuthMiddleware'));
    }

    async handleConnect(server: AuthServer, client: AuthSocket) {
        const accountId = client.data.accountId;

        const sockets = this.userSockets.get(accountId) ?? new Set<string>();

        sockets.add(client.id);
        this.userSockets.set(accountId, sockets);

        await client.join(`user:${accountId}`);

        const { data: conversations } = await this.conversationsService.getMyConversations(accountId, 1, 100);

        const conversationIds = conversations.map(c => c.id);

        client.data.conversationIds = conversationIds;

        await Promise.all(conversationIds.map(id => client.join(`conversation:${id}`)));

        conversationIds.forEach(id => {
            server.to(`conversation:${id}`).emit('user:online', {
                accountId,
                conversationId: id,
            });
        });
    }

    handleDisconnect(server: AuthServer, client: AuthSocket) {
        const accountId = client.data.accountId;
        const sockets = this.userSockets.get(accountId);

        if (!sockets) {
            return;
        }

        sockets.delete(client.id);

        if (sockets.size > 0) {
            return;
        }

        this.userSockets.delete(accountId);

        const conversationIds = client.data.conversationIds ?? [];

        conversationIds.forEach(id => {
            server.to(`conversation:${id}`).emit('user:offline', {
                accountId,
                conversationId: id,
            });
        });
    }
}
