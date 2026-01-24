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

    @Column({
        type: 'enum',
        enum: ConversationType,
    })
    type: ConversationType;

    @Column({ nullable: true })
    title: string;

    @ApiProperty({ nullable: true })
    @Expose()
    @Column({ nullable: true })
    avatar: string;

    @ApiProperty({ nullable: true })
    @Expose()
    @Column({ type: 'text', nullable: true })
    description: string;

    @ManyToOne(() => Message, { nullable: true })
    @JoinColumn({ name: 'last_message_id' })
    lastMessage: Message | null;

    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Expose()
    @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
    lastMessageAt: Date | null;

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

    @OneToMany(() => ConversationMember, m => m.conversation)
    members: ConversationMember[];

    @OneToMany(() => Message, m => m.conversation)
    messages: Message[];

    constructor(partial: Partial<Message>) {
        Object.assign(this, partial);
    }
}
