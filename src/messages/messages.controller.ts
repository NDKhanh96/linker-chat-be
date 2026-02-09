import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CreateMessageDto, MessagesCursorPaginationResponseDto, UnreadCountResponseDto, UpdateMessageDto } from '~/messages/dto';
import { Message } from '~/messages/entities';
import { MessagesService } from '~/messages/messages.service';
import type { CursorPaginationQueryDto } from '~utils/common/dto';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller()
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    @Get('messages/:id')
    @ApiOperation({ summary: 'Get a specific message by ID' })
    @ApiResponse({ status: 200, description: 'Message details', type: Message })
    @ApiResponse({ status: 404, description: 'Message not found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not a member of conversation' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Req() req: Express.AuthenticatedRequest, @Param('id', ParseIntPipe) id: number): Promise<Message> {
        return this.messagesService.findOne(id, req.user.id);
    }

    @Patch('messages/:id')
    @ApiOperation({ summary: 'Update a message (edit content)' })
    @ApiResponse({ status: 200, description: 'Message updated successfully', type: Message })
    @ApiResponse({ status: 403, description: 'Forbidden - Can only update your own messages' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    update(@Req() req: Express.AuthenticatedRequest, @Param('id', ParseIntPipe) id: number, @Body() updateMessageDto: UpdateMessageDto): Promise<Message> {
        return this.messagesService.updateMessage(id, req.user.id, updateMessageDto);
    }

    @Delete('messages/:id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a message' })
    @ApiResponse({ status: 204, description: 'Message deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Can only delete your own messages' })
    @ApiResponse({ status: 404, description: 'Message not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    remove(@Req() req: Express.AuthenticatedRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.messagesService.deleteMessage(id, req.user.id);
    }

    @Get('unread-summary/me')
    @ApiOperation({ summary: 'Get my unread message count' })
    @ApiResponse({ status: 200, description: 'Unread count', type: UnreadCountResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getUnreadCount(@Req() req: Express.AuthenticatedRequest): Promise<UnreadCountResponseDto> {
        return this.messagesService.getUnreadCount(req.user.id);
    }

    @Post('conversations/:conversationId/messages')
    @ApiOperation({ summary: 'Send a message in a conversation' })
    @ApiResponse({ status: 201, description: 'Message sent successfully', type: Message })
    @ApiResponse({ status: 403, description: 'Forbidden - Not a member of conversation' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    sendMessage(
        @Req() req: Express.AuthenticatedRequest,
        @Param('conversationId', ParseIntPipe) conversationId: number,
        @Body() createMessageDto: CreateMessageDto,
    ): Promise<Message> {
        return this.messagesService.sendMessage(conversationId, req.user.id, createMessageDto);
    }

    @Get('conversations/:conversationId/messages')
    @ApiOperation({ summary: 'Get messages in a conversation with cursor pagination' })
    @ApiResponse({ status: 200, description: 'List of messages', type: MessagesCursorPaginationResponseDto })
    @ApiResponse({ status: 403, description: 'Forbidden - Not a member of conversation' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getMessages(
        @Req() req: Express.AuthenticatedRequest,
        @Param('conversationId', ParseIntPipe) conversationId: number,
        @Query() pagination: CursorPaginationQueryDto,
    ): Promise<MessagesCursorPaginationResponseDto> {
        return this.messagesService.getMessages(conversationId, req.user.id, pagination.cursor, pagination.limit);
    }
}
