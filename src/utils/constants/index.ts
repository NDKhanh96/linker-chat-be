import { join } from 'path';

const allowImageType: string[] = ['jpeg', 'jpg', 'png', 'webp', 'gif'];

export const UPLOAD_CONFIG = {
    BASE_DIR: 'uploads',
    AVATAR_DIR: 'avatars',
    ATTACHMENT_DIR: 'attachments',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB for attachments
    MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB for avatars
    ALLOWED_IMAGE_TYPES: allowImageType,
    ALLOWED_ATTACHMENT_TYPES: [
        // Images
        'jpeg',
        'jpg',
        'png',
        'gif',
        'webp',
        // Videos
        'mp4',
        'mov',
        'avi',
        // Documents
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'txt',
    ],
} as const;

export const getUploadPath = (...paths: string[]) => {
    return join(process.cwd(), UPLOAD_CONFIG.BASE_DIR, ...paths);
};

export const getPublicUrl = (...paths: string[]) => {
    return `/${UPLOAD_CONFIG.BASE_DIR}/${paths.join('/')}`;
};

export const swaggerPath: string = 'docs/api';
export const swaggerPathJson: string = `${swaggerPath}/json`;
