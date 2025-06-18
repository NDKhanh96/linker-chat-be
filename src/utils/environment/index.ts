import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync, type ValidationError } from 'class-validator';

import { ValidateBoolean, ValidateNumber } from '~utils/decorator';

/**
 * Việc validate ở đây có 2 tác dụng:
 * - Báo lỗi nếu thiếu biến hoặc biến sai kiểu dữ liệu trong .env file.
 * - Chuyển đổi giá trị từ string sang các kiểu dữ liệu khác, lưu ý việc chuyển đổi chỉ có tác dụng khi get biến môi trường từ ConfigService.
 */
export class EnvFileVariables {
    @IsNotEmpty()
    @ValidateNumber()
    APP_PORT: number;

    @IsNotEmpty()
    @ValidateBoolean()
    DB_SYNCHRONIZE: boolean;

    @IsNotEmpty()
    @IsString()
    DB_HOST: string;

    @IsNotEmpty()
    @ValidateNumber()
    DB_PORT: number;

    @IsNotEmpty()
    @IsString()
    DB_NAME: string;

    @IsNotEmpty()
    @IsString()
    DB_USERNAME: string;

    @IsString()
    DB_PASSWORD: string;

    @IsNotEmpty()
    @ValidateBoolean()
    DB_AUTO_DROP_SCHEMA: boolean;

    @IsNotEmpty()
    @IsString()
    JWT_SECRET: string;

    @IsNotEmpty()
    @IsString()
    JWT_EXPIRES_IN: string;

    @IsNotEmpty()
    @IsString()
    REFRESH_TOKEN_EXPIRES_IN: string;

    @IsNotEmpty()
    @IsString()
    BASE_URL: string;

    @IsNotEmpty()
    @IsString()
    GOOGLE_CLIENT_ID: string;

    @IsNotEmpty()
    @IsString()
    GOOGLE_CLIENT_SECRET: string;

    @IsNotEmpty()
    @IsString()
    MAIL_USER: string;

    @IsNotEmpty()
    @IsString()
    MAIL_PASSWORD: string;
}

export function validate(config: Record<string, unknown>): EnvFileVariables {
    const validatedConfig: EnvFileVariables = plainToInstance(EnvFileVariables, config, {
        /**
         * Nếu để true thì khi get thẳng biến môi trường từ ConfigService sẽ tự động chuyển đổi giá trị từ string sang các kiểu dữ liệu khác.
         * Tuy nhiên, bất kỳ chuỗi nào không rỗng (non-empty string) khi được chuyển đổi sang boolean sẽ luôn là true.
         * Vì vậy nếu muốn giá trị chuyển đổi từ string sang boolean là false thì phải để là string rỗng
         */
        enableImplicitConversion: false,
    });
    const errors: ValidationError[] = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validatedConfig;
}
