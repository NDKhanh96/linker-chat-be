import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, type DeepPartial } from 'typeorm';

import { Attachment } from '~/attachments/entities';
import { Conversation } from '~/conversations/entities';
import { User } from '~/user/entities';

/**
 * Message là tin nhắn trong cuộc trò chuyện, có thể là tin nhắn văn bản, tin nhắn hệ thống (ví dụ: "User joined"), hoặc tin nhắn có tệp đính kèm.
 * - Text, attachments, or both: Một tin nhắn có thể chỉ chứa văn bản, chỉ chứa tệp đính kèm, hoặc cả hai. Điều này cho phép linh hoạt trong việc gửi tin nhắn.
 *
 * System là loại tin nhắn đặc biệt do hệ thống tạo ra để thông báo các sự kiện như người dùng tham gia hoặc rời khỏi cuộc trò chuyện. Chúng không có người gửi cụ thể và thường có nội dung cố định.
 * - System messages: Thông báo hệ thống (ví dụ: "User joined")
 */
export enum MessageType {
    MESSAGE = 'message',
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
        default: MessageType.MESSAGE,
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
