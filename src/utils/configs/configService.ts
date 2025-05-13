import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validate } from '~utils/environment';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
            validate,
        }),
    ],
})
export class ConfigServiceModule {}
