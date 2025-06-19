import { IsString } from 'class-validator';

export class GoogleLoginErrorDto {
    @IsString()
    error: string;

    @IsString()
    error_description: string;
}
