import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

import { CreateAccountDto } from '~/auth/dto/create-account.dto';
import type { Account } from '~/auth/entities';

export class CreateUserDto extends CreateAccountDto {
    @ApiProperty()
    @IsNumber()
    account: Account;
}
