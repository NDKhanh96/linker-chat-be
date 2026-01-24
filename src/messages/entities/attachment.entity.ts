import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from '~/messages/entities';

export enum AttachmentType {
    IMAGE = 'image',
    VIDEO = 'video',
    FILE = 'file',
}

@Entity('attachments')
export class Attachment {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Message, m => m.attachments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'message_id' })
    message: Message;

    @Column({
        type: 'enum',
        enum: AttachmentType,
    })
    type: AttachmentType;

    @Column({ name: 'file_name' })
    fileName: string;

    @Column({ name: 'file_url' })
    fileUrl: string;

    @Column({ name: 'file_size', type: 'bigint', nullable: true })
    fileSize: number;

    @Column({ name: 'mime_type', nullable: true })
    mimeType: string;

    @Column({ nullable: true })
    width: number;

    @Column({ nullable: true })
    height: number;

    @Column({ name: 'thumbnail_url', nullable: true })
    thumbnailUrl: string;
}
