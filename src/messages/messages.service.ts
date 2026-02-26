import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { ConversationsService } from '~/conversations/conversations.service';
import { CreateMessageDto, MessagesCursorPaginationResponseDto, UnreadCountResponseDto, UpdateMessageDto } from '~/messages/dto';
import { Message, MessageType } from '~/messages/entities';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        private readonly conversationsService: ConversationsService,
    ) {}

    async sendMessage(conversationId: number, userId: number, dto: CreateMessageDto): Promise<Message> {
        await this.conversationsService.verifyMembership(conversationId, userId);

        if (dto.replyToId) {
            const replyToMessage = await this.messageRepository.findOne({
                where: { id: dto.replyToId, deletedAt: IsNull() },
                relations: ['conversation'],
            });

            if (!replyToMessage) {
                throw new NotFoundException(`Message with ID ${dto.replyToId} not found or has been deleted`);
            }

            if (replyToMessage.conversation.id !== conversationId) {
                throw new ForbiddenException('Cannot reply to a message from a different conversation');
            }
        }

        const message = new Message({
            content: dto.content,
            type: MessageType.MESSAGE,
            createdBy: userId,
            conversation: { id: conversationId },
            sender: { id: userId },
            ...(dto.replyToId && { replyTo: { id: dto.replyToId } }),
            ...(dto.attachmentIds?.length && {
                attachments: dto.attachmentIds.map(id => ({ id })),
            }),
        });

        const savedMessage = await this.messageRepository.save(message);

        await this.conversationsService.updateLastMessage(conversationId, savedMessage.id, userId);

        return this.findOne(savedMessage.id, userId);
    }

    async getMessages(conversationId: number, userId: number, cursor?: string, limit: number = 20): Promise<MessagesCursorPaginationResponseDto> {
        await this.conversationsService.verifyMembership(conversationId, userId);

        const query = this.messageRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.sender', 'sender')
            .leftJoinAndSelect('message.replyTo', 'replyTo')
            .leftJoinAndSelect('replyTo.sender', 'replyToSender')
            .leftJoinAndSelect('message.attachments', 'attachments')
            .where('message.conversation.id = :conversationId', { conversationId })
            .andWhere('message.deletedAt IS NULL')
            .orderBy('message.createdAt', 'DESC')
            .addOrderBy('message.id', 'DESC')
            .take(limit + 1);

        if (cursor) {
            const [cursorTimestamp, cursorId] = cursor.split('_');

            query.andWhere('(message.createdAt < :cursorTimestamp OR (message.createdAt = :cursorTimestamp AND message.id < :cursorId))', {
                cursorTimestamp: new Date(cursorTimestamp),
                cursorId: parseInt(cursorId),
            });
        }

        const data = await query.getMany();
        const hasMore = data.length > limit;

        if (hasMore) {
            data.pop();
        }

        const last = data[data.length - 1];
        const nextCursor = last ? `${last.createdAt.toISOString()}_${last.id}` : null;

        return new MessagesCursorPaginationResponseDto(data, {
            nextCursor,
            hasMore,
            limit,
        });
    }

    async findOne(messageId: number, userId: number): Promise<Message> {
        const message = await this.messageRepository
            .createQueryBuilder('message')
            .leftJoinAndSelect('message.sender', 'sender')
            .leftJoinAndSelect('message.conversation', 'conversation')
            .leftJoinAndSelect('message.replyTo', 'replyTo')
            .leftJoinAndSelect('replyTo.sender', 'replyToSender')
            .leftJoinAndSelect('message.attachments', 'attachments')
            .where('message.id = :messageId', { messageId })
            .andWhere('message.deletedAt IS NULL')
            .getOne();

        if (!message) {
            throw new NotFoundException('Message not found');
        }

        await this.conversationsService.verifyMembership(message.conversation.id, userId);

        return message;
    }

    async updateMessage(messageId: number, userId: number, dto: UpdateMessageDto): Promise<Message> {
        const message = await this.findOne(messageId, userId);

        if (message.sender.id !== userId) {
            throw new ForbiddenException('You can only update your own messages');
        }

        message.content = dto.content;
        message.isEdited = true;
        message.editedAt = new Date();
        message.updatedBy = userId;

        await this.messageRepository.save(message);

        return this.findOne(messageId, userId);
    }

    async deleteMessage(messageId: number, userId: number): Promise<void> {
        const message = await this.findOne(messageId, userId);

        if (message.sender.id !== userId) {
            throw new ForbiddenException('You can only delete your own messages');
        }

        await this.messageRepository.softDelete(messageId);
    }

    async getUnreadCount(userId: number): Promise<UnreadCountResponseDto> {
        const rows = await this.messageRepository
            .createQueryBuilder('message')
            .select('message.conversation.id', 'conversationId')
            .addSelect('COUNT(message.id)', 'count')
            .innerJoin('message.conversation', 'conversation')
            .innerJoin('conversation.members', 'cm', 'cm.userId = :userId AND cm.deletedAt IS NULL', { userId })
            .where('message.sender.id != :userId', { userId })
            .andWhere('message.deletedAt IS NULL')
            .andWhere('(cm.lastReadMessageId IS NULL OR message.id > cm.lastReadMessageId)')
            .groupBy('message.conversation.id')
            .getRawMany<{ conversationId: number; count: string }>();

        const byConversation: Record<number, number> = {};
        let total = 0;

        for (const row of rows) {
            const count = Number(row.count);

            byConversation[row.conversationId] = count;
            total += count;
        }

        return new UnreadCountResponseDto(total, byConversation);
    }
}
