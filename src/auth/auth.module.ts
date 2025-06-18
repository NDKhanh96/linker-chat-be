import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from '~/auth/auth.controller';
import { AuthService } from '~/auth/auth.service';
import { Account, RefreshToken, VerifyToken } from '~/auth/entities';
import { JwtStrategy } from '~/auth/strategies';
import { MailerServiceModule } from '~utils/configs';

@Module({
    imports: [TypeOrmModule.forFeature([Account, RefreshToken, VerifyToken]), ConfigModule, MailerServiceModule, HttpModule],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
