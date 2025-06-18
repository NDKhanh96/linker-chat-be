import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

function parseBoolean(value: string | boolean | undefined): boolean | undefined {
    switch (value) {
        case undefined:
        case null:
        case '':
            return undefined;
        case true:
        case 'true':
            return true;
        case false:
        case 'false':
            return false;
        default:
            return undefined;
    }
}

export function ValidateBoolean() {
    return applyDecorators(
        Transform(({ value }: { value: string | boolean | undefined }) => parseBoolean(value)),
        IsBoolean(),
    );
}
