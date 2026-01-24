import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConversationsController } from '~/conversations/conversations.controller';
import { ConversationsService } from '~/conversations/conversations.service';
import { Conversation, ConversationMember } from '~/conversations/entities';

@Module({
    imports: [TypeOrmModule.forFeature([Conversation, ConversationMember])],
    controllers: [ConversationsController],
    providers: [ConversationsService],
    exports: [ConversationsService],
})
export class ConversationsModule {}
