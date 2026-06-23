import {
    BadRequestException,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';

import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

import sharp from 'sharp';

import { getAvatarsDir } from '../config/storage';

const AVATAR_SIZE = 512;
const WEBP_QUALITY = 82;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
]);

@Injectable()
export class AvatarService implements OnModuleInit {
    private readonly avatarsDir = getAvatarsDir();

    async onModuleInit() {
        await mkdir(this.avatarsDir, { recursive: true });
    }

    assertValidUpload(file?: Express.Multer.File): void {
        if (!file) {
            return;
        }

        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new BadRequestException(
                'Допустимы только изображения JPG, PNG или WebP',
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(
                'Размер фото не должен превышать 5 МБ',
            );
        }
    }

    getPublicPath(userId: number): string {
        return `/uploads/avatars/user-${userId}.webp`;
    }

    async saveAvatar(
        userId: number,
        file: Express.Multer.File,
        previousPhotoUrl?: string | null,
    ): Promise<string> {
        this.assertValidUpload(file);

        const outputPath = join(this.avatarsDir, `user-${userId}.webp`);

        await sharp(file.buffer)
            .rotate()
            .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
            .webp({ quality: WEBP_QUALITY })
            .toFile(outputPath);

        if (previousPhotoUrl && previousPhotoUrl !== this.getPublicPath(userId)) {
            await this.deleteByPublicPath(previousPhotoUrl);
        }

        return this.getPublicPath(userId);
    }

    async deleteByPublicPath(photoUrl?: string | null): Promise<void> {
        if (!photoUrl || !photoUrl.startsWith('/uploads/avatars/')) {
            return;
        }

        const fileName = photoUrl.replace('/uploads/avatars/', '');

        if (!fileName || fileName.includes('..')) {
            return;
        }

        const filePath = join(this.avatarsDir, fileName);

        try {
            await unlink(filePath);
        } catch {
            // Файл уже удалён или не существовал.
        }
    }

    async deleteAvatar(userId: number, photoUrl?: string | null): Promise<void> {
        await this.deleteByPublicPath(photoUrl ?? this.getPublicPath(userId));
    }
}
