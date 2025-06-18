import { Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';
import { UserModule } from '~/user/user.module';
import { ConfigServiceModule, DatabaseConfigModule, HttpConfigModule, JwtConfigModule, MailerServiceModule } from '~utils/configs';

@Module({
    /**
     * ConfigServiceModule phải ở trên cùng để load .env file trước
     */
    imports: [ConfigServiceModule, DatabaseConfigModule, HttpConfigModule, JwtConfigModule, MailerServiceModule, UserModule, AuthModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
