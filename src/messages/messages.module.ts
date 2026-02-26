import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConversationsModule } from '~/conversations/conversations.module';
import { Message } from '~/messages/entities';
import { MessagesController } from '~/messages/messages.controller';
import { MessagesService } from '~/messages/messages.service';

@Module({
    imports: [TypeOrmModule.forFeature([Message]), ConversationsModule],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService],
})
export class MessagesModule {}
