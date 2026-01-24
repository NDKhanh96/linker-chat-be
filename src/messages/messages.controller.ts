import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateMessageDto } from '~/messages/dto/create-message.dto';
import { UpdateMessageDto } from '~/messages/dto/update-message.dto';
import { MessagesService } from '~/messages/messages.service';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Post()
    create(@Body() createMessageDto: CreateMessageDto) {
        return this.messagesService.create(createMessageDto);
    }

    @Get()
    findAll() {
        return this.messagesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.messagesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
        return this.messagesService.update(+id, updateMessageDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.messagesService.remove(+id);
    }
}
