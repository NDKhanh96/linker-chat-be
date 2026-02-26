import { Module } from '@nestjs/common';

import { AttachmentsModule } from '~/attachments/attachments.module';
import { AuthModule } from '~/auth/auth.module';
import { ChatModule } from '~/chat/chat.module';
import { ConversationsModule } from '~/conversations/conversations.module';
import { MessagesModule } from '~/messages/messages.module';
import { UserModule } from '~/user/user.module';
import { ConfigServiceModule, DatabaseConfigModule, HttpConfigModule, JwtConfigModule, MailerServiceModule } from '~utils/configs';

@Module({
    /**
     * ConfigServiceModule phải ở trên cùng để load .env file trước
     */
    imports: [
        ConfigServiceModule,
        DatabaseConfigModule,
        HttpConfigModule,
        JwtConfigModule,
        MailerServiceModule,
        UserModule,
        AuthModule,
        ConversationsModule,
        MessagesModule,
        AttachmentsModule,
        ChatModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
