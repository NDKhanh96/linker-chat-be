import { Module } from '@nestjs/common';

import { ConfigServiceModule } from '~utils/configs';

@Module({
    /**
     * ConfigServiceModule phải ở trên cùng để load .env file trước
     */
    imports: [ConfigServiceModule],
    controllers: [],
    providers: [],
})
export class AppModule {}
