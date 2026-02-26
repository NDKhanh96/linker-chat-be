import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import {
    AddMemberDto,
    ConversationCursorPaginationResponseDto,
    ConversationOffsetPaginationResponseDto,
    CreateConversationDto,
    UpdateConversationDto,
    type UpdateMemberDto,
} from '~/conversations/dto';
import { Conversation, ConversationMember, ConversationRole, ConversationType } from '~/conversations/entities';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,

        @InjectRepository(ConversationMember)
        private readonly conversationMemberRepository: Repository<ConversationMember>,
    ) {}

    async createConversation(userId: number, dto: CreateConversationDto): Promise<Conversation> {
        const existing = await this.validateCreateConversation(userId, dto);

        if (existing) {
            return existing;
        }

        const savedConversation = await this.conversationRepository.save({
            type: dto.type,
            title: dto.title,
            avatar: dto.avatar,
            description: dto.description,
            createdBy: userId,
        });

        const members = [
            {
                conversationId: savedConversation.id,
                userId,
                role: ConversationRole.ADMIN,
                joinedAt: new Date(),
                createdBy: userId,
            },
            ...dto.memberIds
                .filter(id => id !== userId)
                .map(id => ({
                    conversationId: savedConversation.id,
                    userId: id,
                    role: dto.type === ConversationType.DIRECT ? ConversationRole.ADMIN : ConversationRole.MEMBER,
                    joinedAt: new Date(),
                    createdBy: userId,
                })),
        ];

        await this.conversationMemberRepository.save(members);

        return this.findOne(savedConversation.id, userId);
    }

    async getMyConversations(userId: number, page: number = 1, limit: number = 20): Promise<ConversationOffsetPaginationResponseDto> {
        const [data, total] = await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.members', 'members')
            .leftJoinAndSelect('members.user', 'memberUser')
            .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
            .leftJoinAndSelect('lastMessage.sender', 'messageSender')
            .innerJoin('conversation.members', 'userMember', 'userMember.userId = :userId', { userId })
            .where('conversation.deletedAt IS NULL')
            .andWhere('userMember.deletedAt IS NULL')
            .addSelect('ISNULL(conversation.last_message_at)', 'isNullLastMessage')
            .orderBy('isNullLastMessage', 'ASC')
            .addOrderBy('conversation.lastMessageAt', 'DESC')
            .addOrderBy('conversation.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return new ConversationOffsetPaginationResponseDto(data, {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        });
    }

    /**
     * Cursor-based pagination for infinite scroll
     * Using composite cursor (timestamp + id) for accuracy
     */
    async getMyConversationsCursor(userId: number, limit: number = 20, cursor?: string): Promise<ConversationCursorPaginationResponseDto> {
        const qb = this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.members', 'members')
            .leftJoinAndSelect('members.user', 'memberUser')
            .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
            .leftJoinAndSelect('lastMessage.sender', 'messageSender')
            .innerJoin('conversation.members', 'userMember', 'userMember.userId = :userId', { userId })
            .where('conversation.deletedAt IS NULL')
            .andWhere('userMember.deletedAt IS NULL');

        if (cursor) {
            const [cursorTimestamp, cursorId] = cursor.split('_');

            qb.andWhere('(conversation.lastMessageAt < :cursorTimestamp OR (conversation.lastMessageAt = :cursorTimestamp AND conversation.id < :cursorId))', {
                cursorTimestamp: new Date(cursorTimestamp),
                cursorId: parseInt(cursorId),
            });
        }

        qb.addSelect('conversation.lastMessageAt IS NULL', 'nullsLast')
            .orderBy('nullsLast', 'ASC')
            .addOrderBy('conversation.lastMessageAt', 'DESC')
            .addOrderBy('conversation.id', 'DESC')
            .take(limit + 1);

        const data = await qb.getMany();
        const hasMore = data.length > limit;

        if (hasMore) {
            data.pop();
        }

        const last = data[data.length - 1];
        const nextCursor = last?.lastMessageAt ? `${last.lastMessageAt?.toISOString()}_${last.id}` : null;

        return new ConversationCursorPaginationResponseDto(data, {
            nextCursor,
            hasMore,
            limit,
        });
    }

    async findOne(conversationId: number, userId: number): Promise<Conversation> {
        const conversation = await this.conversationRepository
            .createQueryBuilder('conversation')
            .leftJoinAndSelect('conversation.members', 'members')
            .leftJoinAndSelect('members.user', 'memberUser')
            .leftJoinAndSelect('conversation.lastMessage', 'lastMessage')
            .innerJoin('conversation.members', 'userMember', 'userMember.userId = :userId', { userId })
            .where('conversation.id = :conversationId', { conversationId })
            .andWhere('conversation.deletedAt IS NULL')
            .andWhere('userMember.deletedAt IS NULL')
            .getOne();

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        return conversation;
    }

    async updateConversation(conversationId: number, userId: number, dto: UpdateConversationDto): Promise<Conversation> {
        const conversation = await this.findOne(conversationId, userId);

        if (conversation.type === ConversationType.GROUP) {
            const member = await this.getMember(conversationId, userId);

            if (member.role !== ConversationRole.ADMIN) {
                throw new ForbiddenException('Only admin can update group conversation');
            }
        }

        Object.assign(conversation, dto);
        conversation.updatedBy = userId;

        return this.conversationRepository.save(conversation);
    }

    async addMembers(conversationId: number, userId: number, dto: AddMemberDto): Promise<ConversationMember[]> {
        const conversation = await this.findOne(conversationId, userId);

        if (conversation.type !== ConversationType.GROUP) {
            throw new BadRequestException('Can only add members to group conversations');
        }

        const member = await this.getMember(conversationId, userId);

        if (member.role !== ConversationRole.ADMIN) {
            throw new ForbiddenException('Only admin can add members');
        }

        const existingMembers = await this.conversationMemberRepository.find({
            where: {
                conversationId,
                userId: In(dto.userIds),
            },
        });
        const existingUserIds = new Set(existingMembers.map(m => m.userId));
        const newMembers = dto.userIds
            .filter(id => !existingUserIds.has(id))
            .map(id => ({
                conversationId,
                userId: id,
                role: dto.role || ConversationRole.MEMBER,
                joinedAt: new Date(),
                createdBy: userId,
            }));

        if (newMembers.length === 0) {
            throw new BadRequestException('All users are already members of this conversation');
        }

        return await this.conversationMemberRepository.save(newMembers);
    }

    async removeMember(conversationId: number, userId: number, targetUserId: number): Promise<void> {
        const conversation = await this.findOne(conversationId, userId);

        if (conversation.type !== ConversationType.GROUP) {
            throw new BadRequestException('Can only remove members from group conversations');
        }

        const member = await this.getMember(conversationId, userId);

        if (member.role !== ConversationRole.ADMIN) {
            throw new ForbiddenException('Only admin can remove members');
        }

        if (targetUserId === userId) {
            throw new BadRequestException('Cannot remove yourself, use leave endpoint instead');
        }

        await this.conversationMemberRepository.softDelete({
            conversationId,
            userId: targetUserId,
        });
    }

    async leaveConversation(conversationId: number, userId: number): Promise<void> {
        const conversation = await this.findOne(conversationId, userId);

        if (conversation.type === ConversationType.DIRECT) {
            throw new BadRequestException('Cannot leave direct conversation, delete it instead');
        }

        await this.conversationMemberRepository.softDelete({
            conversationId,
            userId,
        });
    }

    async deleteConversation(conversationId: number, userId: number): Promise<void> {
        const conversation = await this.findOne(conversationId, userId);

        if (conversation.type === ConversationType.GROUP) {
            const member = await this.getMember(conversationId, userId);

            if (member.role !== ConversationRole.ADMIN) {
                throw new ForbiddenException('Only admin can delete group conversation');
            }
        }

        await this.conversationRepository.softDelete(conversationId);
    }

    /**
     * Update lastMessage and lastMessageAt for a conversation
     */
    async updateLastMessage(conversationId: number, messageId: number, userId: number): Promise<void> {
        await this.conversationRepository
            .createQueryBuilder()
            .update(Conversation)
            .set({
                lastMessage: { id: messageId },
                lastMessageAt: new Date(),
                updatedBy: userId,
            })
            .where('id = :id', { id: conversationId })
            .execute();
    }

    /**
     * Verify if user is a member of a conversation
     */
    async verifyMembership(conversationId: number, userId: number): Promise<void> {
        const member = await this.conversationMemberRepository.findOne({
            where: {
                conversationId,
                userId,
            },
        });

        if (!member) {
            throw new ForbiddenException('You are not a member of this conversation');
        }
    }

    /**
     * Update my membership in a conversation
     * E.g., mark as read, mute, pin, etc.
     */
    async updateMyMembership(conversationId: number, userId: number, dto: UpdateMemberDto): Promise<void> {
        const updateData: { updatedBy: number; lastReadMessageId?: number } = {
            updatedBy: userId,
        };

        if (dto.lastReadMessageId !== undefined) {
            updateData.lastReadMessageId = dto.lastReadMessageId;
        }

        const result = await this.conversationMemberRepository.update(
            {
                conversationId,
                userId,
                deletedAt: IsNull(),
            },
            {
                updatedBy: userId,
                lastReadMessageId: dto.lastReadMessageId,
            },
        );

        if (!result.affected) {
            throw new ForbiddenException('You are not a member of this conversation');
        }
    }

    private async getMember(conversationId: number, userId: number): Promise<ConversationMember> {
        const member = await this.conversationMemberRepository.findOne({
            where: { conversationId, userId },
        });

        if (!member) {
            throw new NotFoundException('You are not a member of this conversation');
        }

        return member;
    }

    /**
     * Validate: Direct chat phải có đúng 1 member, Group phải có title
     */
    private async validateCreateConversation(userId: number, dto: CreateConversationDto) {
        if (dto.type === ConversationType.GROUP && !dto.title) {
            throw new UnprocessableEntityException('Group conversation must have a title');
        }

        if (dto.type === ConversationType.DIRECT) {
            if (dto.memberIds.length !== 1) {
                throw new UnprocessableEntityException('Direct conversation must have exactly 1 member');
            }

            return await this.conversationRepository
                .createQueryBuilder('conversation')
                .innerJoin('conversation.members', 'member1', 'member1.userId = :userId', { userId })
                .innerJoin('conversation.members', 'member2', 'member2.userId = :targetUserId', { targetUserId: dto.memberIds[0] })
                .where('conversation.type = :type', { type: ConversationType.DIRECT })
                .andWhere('conversation.deletedAt IS NULL')
                .getOne();
        }

        return null;
    }
}
