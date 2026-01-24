import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Conversation } from '~/conversations/entities';
import { User } from '~/user/entities';

export enum ConversationRole {
    MEMBER = 'member',
    ADMIN = 'admin',
}

@Entity('conversation_members')
export class ConversationMember {
    @ApiProperty()
    @Expose()
    @PrimaryColumn({ name: 'conversation_id' })
    conversationId: number;

    @ApiProperty()
    @Expose()
    @PrimaryColumn({ name: 'user_id' })
    userId: number;

    @ApiProperty({ type: () => Conversation })
    @ManyToOne(() => Conversation, conversation => conversation.members, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ApiProperty({ type: () => User })
    @ManyToOne(() => User, user => user.conversationMembers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ApiProperty()
    @Expose()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Expose()
    @Column({ name: 'updated_at', type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date | null;

    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Expose()
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who created this user' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: number | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who updated this user' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by' })
    updatedBy: number | null;

    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who deleted this user' })
    @Expose()
    @ManyToOne(() => User)
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: number | null;

    @ApiProperty()
    @Expose()
    @Column({
        type: 'enum',
        enum: ConversationRole,
        default: ConversationRole.MEMBER,
    })
    role: ConversationRole;

    @ApiProperty()
    @Expose()
    @Column({ name: 'joined_at', type: 'datetime' })
    joinedAt: Date;

    @ApiProperty()
    @Expose()
    @Column({ name: 'muted_until', type: 'datetime', nullable: true })
    mutedUntil: Date;

    @ApiProperty()
    @Expose()
    @Column({
        name: 'last_read_message_id',
        nullable: true,
    })
    lastReadMessageId: number;
}
