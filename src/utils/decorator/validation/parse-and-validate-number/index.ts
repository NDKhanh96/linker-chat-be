import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

function parseNumber(value: string | number | undefined): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const num = Number(value);

    return isNaN(num) ? undefined : num;
}

export function ValidateNumber() {
    return applyDecorators(
        Transform(({ value }: { value: string | number | undefined }) => parseNumber(value)),
        IsNumber(),
    );
}
