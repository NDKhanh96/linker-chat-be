import { Module } from '@nestjs/common';

import { ConfigServiceModule, DatabaseConfigModule } from '~utils/configs';

@Module({
    /**
     * ConfigServiceModule phải ở trên cùng để load .env file trước
     */
    imports: [ConfigServiceModule, DatabaseConfigModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
