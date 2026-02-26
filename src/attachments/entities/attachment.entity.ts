import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Message } from '~/messages/entities';

export enum AttachmentType {
    IMAGE = 'image',
    VIDEO = 'video',
    FILE = 'file',
}

@Entity('attachments')
export class Attachment {
    @Expose()
    @ApiProperty()
    @PrimaryGeneratedColumn()
    id: number;

    @Expose()
    @ApiProperty()
    @ManyToOne(() => Message, m => m.attachments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'message_id' })
    message: Message;

    @Expose()
    @ApiProperty()
    @Column({
        type: 'enum',
        enum: AttachmentType,
    })
    type: AttachmentType;

    @Expose()
    @ApiProperty()
    @Column({ name: 'file_name' })
    fileName: string;

    @Expose()
    @ApiProperty()
    @Column({ name: 'file_url' })
    fileUrl: string;

    @Expose()
    @ApiProperty()
    @Column({ name: 'file_size', type: 'bigint', nullable: true })
    fileSize: number;

    @Expose()
    @ApiProperty()
    @Column({ name: 'mime_type', nullable: true })
    mimeType: string;

    @Expose()
    @ApiProperty()
    @Column({ nullable: true })
    width: number;

    @Expose()
    @ApiProperty()
    @Column({ nullable: true })
    height: number;

    @Expose()
    @ApiProperty()
    @Column({ name: 'thumbnail_url', nullable: true })
    thumbnailUrl: string;
}
