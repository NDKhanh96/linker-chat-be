/**
 * This import must be the first import in the file.
 */
import 'src/utils/safeExecutionExtensions';

import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

import { ConfigService } from '@nestjs/config';
import { AppModule } from '~/app.module';
import { swaggerPath, swaggerPathJson } from '~utils/constants';
import type { EnvFileVariables } from '~utils/environment';

async function bootstrap() {
    const app: INestApplication<ExpressAdapter> = await NestFactory.create(AppModule);
    const configService: ConfigService<EnvFileVariables, true> = app.get(ConfigService);
    const port: number = configService.get('APP_PORT');

    app.setGlobalPrefix('api');

    /**
     * - Tự động loại bỏ các trường không được khai báo trong DTO.
     * - Nếu request có trường không được khai báo trong DTO thì sẽ trả về lỗi.
     */
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );

    const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder().setTitle('Linker Chat').setVersion('1.0').addBearerAuth().build();

    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(swaggerPath, app, document, {
        jsonDocumentUrl: swaggerPathJson,
    });

    await app.listen(port);
}
void bootstrap();
