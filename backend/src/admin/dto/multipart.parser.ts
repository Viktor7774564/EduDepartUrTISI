import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';

import { RoleCode } from '../../users/entities/role.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

function readString(body: Record<string, unknown>, key: string): string | undefined {
    const value = body[key];

    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    return String(value).trim();
}

function readRequiredString(body: Record<string, unknown>, key: string): string {
    const value = readString(body, key);

    if (!value) {
        throw new BadRequestException(`Поле ${key} обязательно`);
    }

    return value;
}

function readRole(body: Record<string, unknown>): RoleCode {
    const role = readRequiredString(body, 'role');

    if (!Object.values(RoleCode).includes(role as RoleCode)) {
        throw new BadRequestException('Некорректная роль пользователя');
    }

    return role as RoleCode;
}

function readCourse(body: Record<string, unknown>): number | undefined {
    const value = readString(body, 'course');

    if (!value) {
        return undefined;
    }

    const course = Number(value);

    if (!Number.isInteger(course) || course < 1 || course > 6) {
        throw new BadRequestException('Курс должен быть от 1 до 6');
    }

    return course;
}

function readBoolean(body: Record<string, unknown>, key: string): boolean | undefined {
    const value = readString(body, key);

    if (value === undefined) {
        return undefined;
    }

    return value === 'true' || value === '1';
}

export function parseCreateUserBody(
    body: Record<string, unknown>,
): CreateUserDto {
    return {
        login: readRequiredString(body, 'login'),
        password: readRequiredString(body, 'password'),
        role: readRole(body),
        surname: readRequiredString(body, 'surname'),
        name: readRequiredString(body, 'name'),
        patronymic: readString(body, 'patronymic'),
        group: readString(body, 'group'),
        direction: readString(body, 'direction'),
        educationForm: readString(body, 'educationForm'),
        course: readCourse(body),
        department: readString(body, 'department'),
        position: readString(body, 'position'),
        cabinet: readString(body, 'cabinet'),
    };
}

export function parseUpdateUserBody(
    body: Record<string, unknown>,
): UpdateUserDto {
    return {
        login: readRequiredString(body, 'login'),
        password: readString(body, 'password'),
        role: readRole(body),
        surname: readRequiredString(body, 'surname'),
        name: readRequiredString(body, 'name'),
        patronymic: readString(body, 'patronymic'),
        isActive: readBoolean(body, 'isActive'),
        removePhoto: readBoolean(body, 'removePhoto'),
        group: readString(body, 'group'),
        direction: readString(body, 'direction'),
        educationForm: readString(body, 'educationForm'),
        course: readCourse(body),
        department: readString(body, 'department'),
        position: readString(body, 'position'),
        cabinet: readString(body, 'cabinet'),
    };
}

export const avatarUploadOptions = {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (
        _req: Request,
        file: Express.Multer.File,
        callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowed.includes(file.mimetype)) {
            callback(
                new BadRequestException(
                    'Допустимы только изображения JPG, PNG или WebP',
                ),
                false,
            );
            return;
        }

        callback(null, true);
    },
};
