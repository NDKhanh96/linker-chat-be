import { Module } from '@nestjs/common';

import { ChatGateway } from '~/chat/chat.gateway';
import { ChatConnectionService, ChatOrchestrationService } from '~/chat/services';
import { ConversationsModule } from '~/conversations/conversations.module';
import { MessagesModule } from '~/messages/messages.module';

@Module({
    imports: [ConversationsModule, MessagesModule],
    providers: [ChatGateway, ChatConnectionService, ChatOrchestrationService],
})
export class ChatModule {}
