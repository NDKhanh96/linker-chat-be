import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import type { EnvFileVariables } from 'src/utils/environment';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService<EnvFileVariables, true>) => ({
                transport: {
                    host: 'smtp.gmail.com',
                    /**
                     * Port 465 thường chỉ còn được dùng cho hệ thống cũ, hiện tại thì port 587 là phổ biến nhất.
                     */
                    port: 587,
                    /**
                     * Chỉ secure: true khi dùng port 465
                     * port 465 là port dành riêng cho SSL
                     */
                    secure: false,
                    auth: {
                        user: configService.get('MAIL_USER', { infer: true }),
                        pass: configService.get('MAIL_PASSWORD', { infer: true }),
                    },
                },
                defaults: {
                    from: `"No Reply" <${configService.get('MAIL_USER', { infer: true })}>`,
                },
            }),
            inject: [ConfigService],
        }),
    ],
})
export class MailerServiceModule {}
