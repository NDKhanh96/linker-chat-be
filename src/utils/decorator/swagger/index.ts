import { applyDecorators, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath, type ApiResponseOptions } from '@nestjs/swagger';

type ApiResponseOneOfOptions = ApiResponseOptions & {
    models: Type<unknown>[];
};

export function ApiResponseOneOf(options: ApiResponseOneOfOptions): MethodDecorator {
    const { status = 200, description = 'Success', models } = options;

    return applyDecorators(
        ApiExtraModels(...models),
        ApiResponse({
            status,
            description,
            schema: {
                oneOf: models.map(model => ({ $ref: getSchemaPath(model) })),
            },
        }),
    );
}
