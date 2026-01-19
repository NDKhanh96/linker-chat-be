import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import type { Repository } from 'typeorm';

import type { UpdateProfileDto } from '~/user/dto/';
import { User } from '~/user/entities';
import { getPublicUrl, getUploadPath, UPLOAD_CONFIG } from '~utils/constants';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    findAll() {
        return this.userRepository.find({ relations: { account: true } });
    }

    findOne(id: number) {
        return this.userRepository.findOne({ where: { id }, relations: { account: true } });
    }

    async update(id: number, updateUserDto: UpdateProfileDto) {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: { account: true },
        });

        if (!user) {
            throw new NotFoundException(`User ${id} not found`);
        }

        if (updateUserDto.avatar?.startsWith('data:image/')) {
            const avatarUrl = await this.saveBase64Image(updateUserDto.avatar, id, user.avatar);

            updateUserDto.avatar = avatarUrl;
        }

        Object.assign(user, updateUserDto);

        return this.userRepository.save(user);
    }

    /**
     * Lưu ảnh avatar được gửi dưới dạng base64 cho người dùng.
     *
     * Chức năng của hàm:
     * - Kiểm tra định dạng chuỗi base64 có đúng chuẩn data:image/*;base64,... hay không
     * - Tách loại ảnh (jpg, png, webp, ...) và dữ liệu base64
     * - Kiểm tra kích thước ảnh sau khi decode (tối đa 5MB)
     * - Chuyển base64 sang Buffer nhị phân
     * - Lưu file ảnh vào thư mục /uploads/avatars
     * - Nếu người dùng đã có avatar cũ trong thư mục uploads thì sẽ xóa file cũ
     * - Tạo tên file mới dựa trên userId và timestamp để tránh trùng lặp
     *
     * @param base64String Chuỗi ảnh base64 theo định dạng Data URL
     * @param userId ID của người dùng sở hữu avatar
     * @param oldAvatar Đường dẫn avatar cũ (nếu có)
     *
     * @returns Đường dẫn tương đối của avatar đã lưu
     *
     * @throws Error nếu chuỗi base64 không đúng định dạng hoặc kích thước vượt quá giới hạn
     */
    async saveBase64Image(base64String: string, userId: number, oldAvatar?: string): Promise<string> {
        const matches = base64String.match(/^data:image\/(\w+);base64,(.+)$/);

        if (!matches) {
            throw new Error('Invalid base64 image format');
        }

        const [, extension, data] = matches;

        if (!UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES.includes(extension.toLowerCase())) {
            throw new Error(`Unsupported image type: ${extension}`);
        }

        const sizeInBytes = (data.length * 3) / 4;

        if (sizeInBytes > UPLOAD_CONFIG.MAX_FILE_SIZE) {
            throw new Error(`Image size exceeds ${UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
        }

        const buffer = Buffer.from(data, 'base64');
        const uploadDir = getUploadPath(UPLOAD_CONFIG.AVATAR_DIR);

        await fs.mkdir(uploadDir, { recursive: true });

        if (oldAvatar?.startsWith(`/${UPLOAD_CONFIG.BASE_DIR}/`)) {
            const oldFilePath = getUploadPath(...oldAvatar.split('/').slice(2));

            await fs.unlink(oldFilePath);
        }

        const filename = `${userId}-${Date.now()}.${extension}`;
        const filepath = getUploadPath(UPLOAD_CONFIG.AVATAR_DIR, filename);

        await fs.writeFile(filepath, buffer);

        return getPublicUrl(UPLOAD_CONFIG.AVATAR_DIR, filename);
    }
}
