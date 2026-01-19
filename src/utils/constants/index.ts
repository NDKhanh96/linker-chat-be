import { join } from 'path';

const allowImageType: string[] = ['jpeg', 'jpg', 'png', 'webp', 'gif'];

export const UPLOAD_CONFIG = {
    BASE_DIR: 'uploads',
    AVATAR_DIR: 'avatars',
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: allowImageType,
} as const;

export const getUploadPath = (...paths: string[]) => {
    return join(process.cwd(), UPLOAD_CONFIG.BASE_DIR, ...paths);
};

export const getPublicUrl = (...paths: string[]) => {
    return `/${UPLOAD_CONFIG.BASE_DIR}/${paths.join('/')}`;
};

export const swaggerPath: string = 'docs/api';
export const swaggerPathJson: string = `${swaggerPath}/json`;
