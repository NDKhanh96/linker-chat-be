import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';

import { AppModule } from '~/app.module';

async function bootstrap() {
    const app: INestApplication<ExpressAdapter> = await NestFactory.create(AppModule);

    await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
