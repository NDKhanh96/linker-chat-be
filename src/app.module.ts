import { Module } from '@nestjs/common';

import { AuthModule } from '~/auth/auth.module';
import { UserModule } from '~/user/user.module';
import { ConfigServiceModule, DatabaseConfigModule } from '~utils/configs';
import { JwtConfigModule } from '~utils/configs/jwt';
import { MailerServiceModule } from '~utils/configs/mailerService';

@Module({
    /**
     * ConfigServiceModule phải ở trên cùng để load .env file trước
     */
    imports: [ConfigServiceModule, DatabaseConfigModule, JwtConfigModule, MailerServiceModule, UserModule, AuthModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
