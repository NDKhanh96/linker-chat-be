import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';

import { ConversationsService } from '~/conversations/conversations.service';
import {
    AddMemberDto,
    ConversationCursorPaginationResponseDto,
    ConversationOffsetPaginationResponseDto,
    CreateConversationDto,
    UpdateConversationDto,
    UpdateMemberDto,
} from '~/conversations/dto';
import { Conversation, ConversationMember } from '~/conversations/entities';
import type { CursorPaginationQueryDto, OffsetPaginationMetaDto } from '~utils/common/dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@ApiExtraModels(ConversationOffsetPaginationResponseDto, ConversationCursorPaginationResponseDto)
@UseGuards(AuthGuard('jwt'))
@Controller('conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) {}

    @Get()
    @ApiOperation({ summary: 'Get my conversations (supports both offset and cursor pagination)' })
    @ApiResponse({
        status: 200,
        description: 'List of conversations',
        schema: {
            oneOf: [{ $ref: getSchemaPath(ConversationOffsetPaginationResponseDto) }, { $ref: getSchemaPath(ConversationCursorPaginationResponseDto) }],
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll(
        @Req() req: Express.AuthenticatedRequest,
        @Query() offsetPagination: OffsetPaginationMetaDto,
        @Query() cursorPagination: CursorPaginationQueryDto,
    ): Promise<ConversationOffsetPaginationResponseDto | ConversationCursorPaginationResponseDto> {
        return offsetPagination.page
            ? this.conversationsService.getMyConversations(req.user.id, offsetPagination.limit, offsetPagination.page)
            : this.conversationsService.getMyConversationsCursor(req.user.id, cursorPagination.limit, cursorPagination.cursor);
    }

    @Post()
    @ApiBody({ type: CreateConversationDto })
    @ApiOperation({ summary: 'Create a new conversation (direct or group)' })
    @ApiResponse({ status: 201, description: 'Conversation created successfully', type: Conversation })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(@Req() req: Express.AuthenticatedRequest, @Body() createConversationDto: CreateConversationDto): Promise<Conversation> {
        return this.conversationsService.createConversation(req.user.id, createConversationDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get conversation by ID' })
    @ApiResponse({ status: 200, description: 'Conversation details', type: Conversation })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Req() req: Express.AuthenticatedRequest, @Param('id', ParseIntPipe) id: number): Promise<Conversation> {
        return this.conversationsService.findOne(id, req.user.id);
    }

    @Patch(':id')
    @ApiBody({ type: UpdateConversationDto })
    @ApiOperation({ summary: 'Update conversation' })
    @ApiResponse({ status: 200, description: 'Conversation updated successfully', type: Conversation })
    @ApiResponse({ status: 403, description: 'Forbidden - Only admin can update' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    update(
        @Req() req: Express.AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateConversationDto: UpdateConversationDto,
    ): Promise<Conversation> {
        return this.conversationsService.updateConversation(id, req.user.id, updateConversationDto);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a conversation' })
    @ApiResponse({ status: 204, description: 'Conversation deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Only admin can delete group conversation' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    remove(@Req() req: Express.AuthenticatedRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.conversationsService.deleteConversation(id, req.user.id);
    }

    // TODO: Chuyển sang module mới
    @Post(':id/members')
    @HttpCode(200)
    @ApiBody({ type: AddMemberDto })
    @ApiOperation({ summary: 'Add members to group conversation' })
    @ApiResponse({ status: 200, description: 'Members added successfully', type: () => ConversationMember, isArray: true })
    @ApiResponse({ status: 400, description: 'Bad request - Can only add to group' })
    @ApiResponse({ status: 403, description: 'Forbidden - Only admin can add members' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    addMembers(
        @Req() req: Express.AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
        @Body() addMemberDto: AddMemberDto,
    ): Promise<ConversationMember[]> {
        return this.conversationsService.addMembers(id, req.user.id, addMemberDto);
    }

    // TODO: Chuyển sang module mới
    // TODO: Thêm chức năng khác như mute, pin,...
    @Patch(':id/members/me')
    @HttpCode(204)
    @ApiOperation({ summary: 'Update my membership in a conversation (e.g., mark as read)' })
    @ApiResponse({ status: 204, description: 'Membership updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not a member of conversation' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    updateMyMembership(
        @Req() req: Express.AuthenticatedRequest,
        @Param('id', ParseIntPipe) conversationId: number,
        @Body() updateMemberDto: UpdateMemberDto,
    ): Promise<void> {
        return this.conversationsService.updateMyMembership(conversationId, req.user.id, updateMemberDto);
    }

    // TODO: Chuyển sang module mới
    @Delete(':id/members/:userId')
    @HttpCode(204)
    @ApiOperation({ summary: 'Remove a member from group conversation' })
    @ApiResponse({ status: 204, description: 'Member removed successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 403, description: 'Forbidden - Only admin can remove members' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    removeMember(
        @Req() req: Express.AuthenticatedRequest,
        @Param('id', ParseIntPipe) id: number,
        @Param('userId', ParseIntPipe) userId: number,
    ): Promise<void> {
        return this.conversationsService.removeMember(id, req.user.id, userId);
    }

    // TODO: Chuyển sang module mới
    @Delete(':id/members/me')
    @HttpCode(204)
    @ApiOperation({ summary: 'Leave a group conversation (remove myself from members)' })
    @ApiResponse({ status: 204, description: 'Left conversation successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - Cannot leave direct conversation' })
    @ApiResponse({ status: 404, description: 'Conversation not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    leave(@Req() req: Express.AuthenticatedRequest, @Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.conversationsService.leaveConversation(id, req.user.id);
    }
}
