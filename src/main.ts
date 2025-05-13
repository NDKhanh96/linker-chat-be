/**
 * This import must be the first import in the file.
 */
import 'src/utils/safeExecutionExtensions';

import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';

import { AppModule } from '~/app.module';
import { ConfigService } from '@nestjs/config';
import type { EnvFileVariables } from '~utils/environment';

async function bootstrap() {
    const app: INestApplication<ExpressAdapter> = await NestFactory.create(AppModule);
    const configService: ConfigService<EnvFileVariables, true> = app.get(ConfigService);
    const port: number = configService.get('APP_PORT');

    await app.listen(port);
}
void bootstrap();
