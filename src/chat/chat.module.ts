import { Module } from '@nestjs/common';

import { ChatEventListener } from '~/chat/chat-event.listener';
import { ChatSubscribeGateway } from '~/chat/chat-subscribe.gateway';
import { ChatGateway } from '~/chat/chat.gateway';
import { ChatConnectionService, ChatOrchestrationService } from '~/chat/services';
import { ConversationsModule } from '~/conversations/conversations.module';
import { MessagesModule } from '~/messages/messages.module';

@Module({
    imports: [ConversationsModule, MessagesModule],
    providers: [ChatGateway, ChatSubscribeGateway, ChatConnectionService, ChatOrchestrationService, ChatEventListener],
})
export class ChatModule {}
