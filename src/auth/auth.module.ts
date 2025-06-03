import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import { GoogleStrategy, JwtStrategy } from '~/auth/strategies';
import { MailerServiceModule } from '~utils/configs/mailerService';

@Module({
    imports: [TypeOrmModule.forFeature([Account, RefreshToken, VerifyToken]), ConfigModule, MailerServiceModule],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
