import { PartialType } from '@nestjs/swagger';

import { CreateConversationDto } from '~/conversations/dto/create-conversation.dto';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {}
