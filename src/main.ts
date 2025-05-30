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
     * - transform để tự động chuyển đổi kiểu dữ liệu của các trường trong DTO.
     * - Ví dụ: nếu trong DTO có trường age là number thì khi nhận request có trường age là string thì sẽ tự động chuyển đổi thành number.
     * - Những plain object nhận từ request sẽ được chuyển đổi thành class instance theo DTO.
     */
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
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
