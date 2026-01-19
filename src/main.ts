/**
 * This import must be the first import in the file.
 */
import '~utils/safe-execution-extension';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { join } from 'path';

import { AppModule } from '~/app.module';
import { swaggerPath, swaggerPathJson } from '~utils/constants';
import type { EnvFileVariables } from '~utils/environment';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const configService: ConfigService<EnvFileVariables, true> = app.get(ConfigService);
    const port: number = configService.get('APP_PORT');

    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });

    app.use(json({ limit: '6mb' }));
    app.use(urlencoded({ extended: true, limit: '6mb' }));

    app.setGlobalPrefix('api', {
        exclude: ['/uploads/*path'],
    });

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

    const config: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
        .setTitle('Linker Chat')
        .setVersion('1.0')
        .addBearerAuth()
        .addOAuth2({
            type: 'oauth2',
            flows: {
                authorizationCode: {
                    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                    tokenUrl: 'https://oauth2.googleapis.com/token',
                    scopes: {
                        profile: 'profile',
                        email: 'email',
                    },
                },
            },
        })
        .build();

    const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(swaggerPath, app, document, {
        jsonDocumentUrl: swaggerPathJson,
    });

    await app.listen(port);
}
void bootstrap();
