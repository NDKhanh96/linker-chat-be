import { PartialType } from '@nestjs/swagger';

import { CreateAuthDto } from '~/auth/dto/create-auth.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
