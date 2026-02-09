import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { ConversationMember } from '~/conversations/entities';
import { Message } from '~/messages/entities';
import { User } from '~/user/entities';

export enum ConversationType {
    DIRECT = 'direct',
    GROUP = 'group',
}

@Entity('conversations')
export class Conversation {
    @ApiProperty()
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @Expose()
    @ApiProperty({ enum: ConversationType })
    @Column({ type: 'enum', enum: ConversationType })
    type: ConversationType;

    @Expose()
    @ApiProperty({ nullable: true })
    @Column({ nullable: true })
    title: string;

    @Expose()
    @ApiProperty({ nullable: true })
    @Column({ nullable: true })
    avatar: string;

    @Expose()
    @ApiProperty({ nullable: true })
    @Column({ type: 'text', nullable: true })
    description: string;

    @Expose()
    @ApiProperty({ type: () => Message, nullable: true })
    @ManyToOne(() => Message, { nullable: true })
    @JoinColumn({ name: 'last_message_id' })
    lastMessage: Message | null;

    @Expose()
    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
    lastMessageAt: Date | null;

    @Expose()
    @ApiProperty()
    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Expose()
    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Column({ name: 'updated_at', type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date | null;

    @Expose()
    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
    deletedAt: Date | null;

    @Expose()
    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who created this user' })
    @ManyToOne(() => User)
    @JoinColumn({ name: 'created_by' })
    createdBy: number | null;

    @Expose()
    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who updated this user' })
    @ManyToOne(() => User)
    @JoinColumn({ name: 'updated_by' })
    updatedBy: number | null;

    @Expose()
    @ApiProperty({ type: 'number', nullable: true, description: 'ID of the user who deleted this user' })
    @ManyToOne(() => User)
    @JoinColumn({ name: 'deleted_by' })
    deletedBy: number | null;

    @Expose()
    @ApiProperty({ type: () => [ConversationMember] })
    @OneToMany(() => ConversationMember, m => m.conversation)
    members: ConversationMember[];

    @Expose()
    @ApiProperty({ type: () => [Message] })
    @OneToMany(() => Message, m => m.conversation)
    messages: Message[];

    constructor(partial: Partial<Message>) {
        Object.assign(this, partial);
    }
}
