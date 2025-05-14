import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { EnvFileVariables } from 'src/utils/environment';

@Module({
    imports: [
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            useFactory: (configService: ConfigService<EnvFileVariables, true>) => ({
                secret: configService.get('JWT_SECRET', { infer: true }),
                signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', { infer: true }) },
            }),
            inject: [ConfigService],
        }),
    ],
})
export class JwtConfigModule {}
