import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import { MailerServiceModule } from '~utils/configs/mailerService';

@Module({
    imports: [TypeOrmModule.forFeature([Account, RefreshToken, VerifyToken]), ConfigModule, MailerServiceModule],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
