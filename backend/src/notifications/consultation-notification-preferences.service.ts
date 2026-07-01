import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { formatTeacherDepartmentLabel } from '../academic/teacher-departments.constants';
import { formatTeacherName } from '../schedule/schedule-item.mapper';
import { RoleCode } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { ConsultationNotificationPreference } from './consultation-notification-preference.entity';
import {
    ConsultationNotificationPreferenceResponse,
    ConsultationTeacherOption,
    UpdateConsultationNotificationPreferenceDto,
} from './dto/consultation-notification-preference.dto';

const DEFAULT_PREFERENCES: ConsultationNotificationPreferenceResponse = {
    enabled: false,
    allTeachers: true,
    teacherIds: [],
};

@Injectable()
export class ConsultationNotificationPreferencesService {
    constructor(
        @InjectRepository(ConsultationNotificationPreference)
        private readonly preferencesRepository: Repository<ConsultationNotificationPreference>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    async getForUser(userId: number): Promise<ConsultationNotificationPreferenceResponse> {
        const preference = await this.preferencesRepository.findOne({
            where: { userId },
        });

        if (!preference) {
            return { ...DEFAULT_PREFERENCES };
        }

        return this.mapPreference(preference);
    }

    async updateForUser(
        userId: number,
        dto: UpdateConsultationNotificationPreferenceDto,
    ): Promise<ConsultationNotificationPreferenceResponse> {
        if (dto.enabled && !dto.allTeachers) {
            const teacherIds = dto.teacherIds ?? [];

            if (teacherIds.length === 0) {
                throw new BadRequestException('Выберите хотя бы одного преподавателя');
            }

            await this.assertTeachersExist(teacherIds);
        }

        const teacherIds = dto.allTeachers ? [] : [...new Set(dto.teacherIds ?? [])];

        let preference = await this.preferencesRepository.findOne({
            where: { userId },
        });

        if (!preference) {
            preference = this.preferencesRepository.create({ userId });
        }

        preference.enabled = dto.enabled;
        preference.allTeachers = dto.allTeachers;
        preference.teacherIds = teacherIds;

        const saved = await this.preferencesRepository.save(preference);

        return this.mapPreference(saved);
    }

    async listTeacherOptions(): Promise<ConsultationTeacherOption[]> {
        const teachers = await this.usersRepository
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .innerJoinAndSelect('user.teacherProfile', 'teacherProfile')
            .innerJoinAndSelect('teacherProfile.department', 'department')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere('role.code = :roleCode', { roleCode: RoleCode.TEACHER })
            .orderBy('user.surname', 'ASC')
            .addOrderBy('user.name', 'ASC')
            .addOrderBy('user.patronymic', 'ASC')
            .getMany();

        return teachers.map((teacher) => ({
            id: teacher.id,
            name: formatTeacherName(teacher),
            departmentId: teacher.teacherProfile!.departmentId,
            departmentLabel: formatTeacherDepartmentLabel({
                shortName: teacher.teacherProfile!.department.shortName ?? '',
                name: teacher.teacherProfile!.department.name,
            }),
        }));
    }

    async findSubscriberUserIds(teacherId: number): Promise<number[]> {
        const preferences = await this.preferencesRepository
            .createQueryBuilder('preference')
            .select('preference.userId', 'userId')
            .where('preference.enabled = :enabled', { enabled: true })
            .andWhere(
                '(preference.allTeachers = true OR preference.teacherIds @> :teacherIds::jsonb)',
                { teacherIds: JSON.stringify([teacherId]) },
            )
            .getRawMany<{ userId: number }>();

        return preferences.map((row) => Number(row.userId));
    }

    private async assertTeachersExist(teacherIds: number[]): Promise<void> {
        const teachers = await this.usersRepository.find({
            where: {
                id: In(teacherIds),
                isActive: true,
            },
            relations: ['teacherProfile'],
        });

        const validIds = new Set(
            teachers
                .filter((teacher) => Boolean(teacher.teacherProfile))
                .map((teacher) => teacher.id),
        );

        const missingIds = teacherIds.filter((id) => !validIds.has(id));

        if (missingIds.length > 0) {
            throw new BadRequestException('Некоторые преподаватели не найдены');
        }
    }

    private mapPreference(
        preference: ConsultationNotificationPreference,
    ): ConsultationNotificationPreferenceResponse {
        return {
            enabled: preference.enabled,
            allTeachers: preference.allTeachers,
            teacherIds: preference.teacherIds ?? [],
        };
    }
}
