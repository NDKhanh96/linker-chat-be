import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { extname } from 'path';
import { Repository } from 'typeorm';

import { Attachment, AttachmentType } from '~/attachments/entities';
import { getPublicUrl, getUploadPath, UPLOAD_CONFIG } from '~utils/constants';

type UploadType = 'message-attachment' | 'avatar' | 'group-icon';

interface UploadOptions {
    maxSize: number;
    allowedTypes: readonly string[];
    uploadDir: string;
}

const UPLOAD_OPTIONS: Record<UploadType, UploadOptions> = {
    'message-attachment': {
        maxSize: UPLOAD_CONFIG.MAX_FILE_SIZE,
        allowedTypes: UPLOAD_CONFIG.ALLOWED_ATTACHMENT_TYPES,
        uploadDir: UPLOAD_CONFIG.ATTACHMENT_DIR,
    },
    avatar: {
        maxSize: UPLOAD_CONFIG.MAX_AVATAR_SIZE,
        allowedTypes: UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
        uploadDir: UPLOAD_CONFIG.AVATAR_DIR,
    },
    'group-icon': {
        maxSize: UPLOAD_CONFIG.MAX_AVATAR_SIZE,
        allowedTypes: UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
        uploadDir: UPLOAD_CONFIG.AVATAR_DIR,
    },
};

@Injectable()
export class AttachmentsService {
    constructor(
        @InjectRepository(Attachment)
        private readonly attachmentRepository: Repository<Attachment>,
    ) {}

    /**
     * Upload file for message attachments
     */
    async uploadMessageAttachment(buffer: Buffer, fileName: string, mimeType: string, userId: number): Promise<Attachment> {
        const publicUrl = await this.uploadFile(buffer, fileName, userId, 'message-attachment');

        let type: AttachmentType;

        if (mimeType.startsWith('image/')) {
            type = AttachmentType.IMAGE;
        } else if (mimeType.startsWith('video/')) {
            type = AttachmentType.VIDEO;
        } else {
            type = AttachmentType.FILE;
        }

        const attachment = this.attachmentRepository.create({
            type,
            fileName,
            fileUrl: publicUrl,
            fileSize: buffer.length,
            mimeType,
        });

        return this.attachmentRepository.save(attachment);
    }

    /**
     * Upload avatar image
     */
    async uploadAvatar(buffer: Buffer, fileName: string, userId: number): Promise<string> {
        return this.uploadFile(buffer, fileName, userId, 'avatar');
    }

    /**
     * Upload group icon image
     */
    async uploadGroupIcon(buffer: Buffer, fileName: string, userId: number): Promise<string> {
        return this.uploadFile(buffer, fileName, userId, 'group-icon');
    }

    /**
     * Generic file upload handler
     * @returns Public URL of uploaded file
     */
    private async uploadFile(buffer: Buffer, fileName: string, userId: number, uploadType: UploadType): Promise<string> {
        const options = UPLOAD_OPTIONS[uploadType];

        if (buffer.length > options.maxSize) {
            throw new BadRequestException(`File size exceeds ${options.maxSize / (1024 * 1024)}MB limit`);
        }

        const ext = extname(fileName).slice(1).toLowerCase();

        if (ext && !options.allowedTypes.includes(ext)) {
            throw new BadRequestException(`File type .${ext} is not allowed for ${uploadType}`);
        }

        const uploadDir = getUploadPath(options.uploadDir);

        await mkdir(uploadDir, { recursive: true });

        const uniqueFileName = `${userId}-${Date.now()}${extname(fileName)}`;
        const filePath = getUploadPath(options.uploadDir, uniqueFileName);

        await writeFile(filePath, buffer);

        return getPublicUrl(options.uploadDir, uniqueFileName);
    }
}
