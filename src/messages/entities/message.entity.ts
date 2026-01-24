import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, type DeepPartial } from 'typeorm';

import { Conversation } from '~/conversations/entities';
import { Attachment } from '~/messages/entities';
import { User } from '~/user/entities';

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
    SYSTEM = 'system',
}

@Entity('messages')
@Index(['conversation', 'createdAt'])
export class Message {
    @ApiProperty()
    @Expose()
    @PrimaryGeneratedColumn()
    id: number;

    @ApiProperty({ type: () => Conversation })
    @Expose()
    @ManyToOne(() => Conversation, c => c.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @ApiProperty({ type: () => User })
    @Expose()
    @ManyToOne(() => User, user => user.messages)
    @JoinColumn({ name: 'sender_id' })
    sender: User;

    @ApiProperty()
    @Expose()
    @Column({
        type: 'enum',
        enum: MessageType,
        default: MessageType.TEXT,
    })
    type: MessageType;

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
    @Column({ type: 'text', nullable: true })
    content: string;

    @ApiProperty()
    @Expose()
    @Column({ name: 'is_edited', type: 'boolean', default: false })
    isEdited: boolean;

    @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
    @Expose()
    @Column({ name: 'edited_at', type: 'timestamp', nullable: true })
    editedAt: Date | null;

    @ApiProperty()
    @Expose()
    @ManyToOne(() => Message, { nullable: true })
    @JoinColumn({ name: 'reply_to' })
    replyTo: Message;

    @ApiProperty()
    @Expose()
    @OneToMany(() => Attachment, a => a.message)
    attachments: Attachment[];

    constructor(partial: DeepPartial<Message>) {
        Object.assign(this, partial);
    }
}
