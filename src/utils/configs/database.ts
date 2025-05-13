import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import type { DataSourceOptions } from 'typeorm';

import type { EnvFileVariables } from '~utils/environment';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService<EnvFileVariables, true>): DataSourceOptions => ({
                type: 'mysql',
                host: configService.get('DB_HOST', { infer: true }),
                port: configService.get('DB_PORT', { infer: true }),
                username: configService.get('DB_USERNAME', { infer: true }),
                password: configService.get('DB_PASSWORD', { infer: true }),
                database: configService.get('DB_NAME', { infer: true }),
                synchronize: configService.get('DB_SYNCHRONIZE', { infer: true }),
                entities: [join(__dirname, '../../', '**', '*.entity.{ts,js}')],
                dropSchema: configService.get('DB_AUTO_DROP_SCHEMA', { infer: true }),
            }),
            inject: [ConfigService],
        }),
    ],
})
export class DatabaseConfigModule {}
