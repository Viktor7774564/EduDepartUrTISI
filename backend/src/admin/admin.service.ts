import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { mapUserToAuthResponse } from '../auth/auth-user.mapper';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Role, RoleCode } from '../users/entities/role.entity';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { StaffProfile } from '../users/entities/staff-profile.entity';
import { DepartmentsService } from '../academic/departments.service';
import { Department } from '../academic/entities/department.entity';
import { Direction } from '../academic/entities/direction.entity';
import { EducationForm, Group } from '../academic/entities/group.entity';
import {
    buildDirectionDisplayName,
    buildDirectionStorageCode,
    validateDirectionInput,
} from '../academic/direction.utils';
import { AdminSessionResponse } from '../sessions/sessions.types';
import { SessionsService } from '../sessions/sessions.service';
import { SessionsNotifierService } from '../sessions/sessions-notifier.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AvatarService } from '../uploads/avatar.service';
import { ConsultationNotificationPreference } from '../notifications/consultation-notification-preference.entity';
import { Consultation } from '../schedule/entities/consultation.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { ScheduleItem } from '../schedule/entities/schedule-item.entity';
import { ScheduleUpload } from '../schedule/entities/schedule-upload.entity';

export type { AdminSessionResponse };

export type AdminUserResponse = ReturnType<typeof mapUserToAuthResponse> & {
    isActive: boolean;
};

@Injectable()
export class AdminService {
    constructor(
        private readonly usersService: UsersService,
        private readonly sessionsService: SessionsService,
        private readonly sessionsNotifier: SessionsNotifierService,
        private readonly avatarService: AvatarService,
        private readonly departmentsService: DepartmentsService,

        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,

        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,

        @InjectRepository(StudentProfile)
        private readonly studentProfileRepository: Repository<StudentProfile>,

        @InjectRepository(TeacherProfile)
        private readonly teacherProfileRepository: Repository<TeacherProfile>,

        @InjectRepository(StaffProfile)
        private readonly staffProfileRepository: Repository<StaffProfile>,

        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,

        @InjectRepository(Direction)
        private readonly directionRepository: Repository<Direction>,

        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,

        @InjectRepository(Consultation)
        private readonly consultationsRepository: Repository<Consultation>,

        @InjectRepository(ScheduleItem)
        private readonly scheduleItemsRepository: Repository<ScheduleItem>,

        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,

        @InjectRepository(ScheduleUpload)
        private readonly scheduleUploadsRepository: Repository<ScheduleUpload>,

        @InjectRepository(ConsultationNotificationPreference)
        private readonly consultationPreferencesRepository: Repository<ConsultationNotificationPreference>,
    ) {}

    async listUsers(): Promise<AdminUserResponse[]> {
        const users = await this.usersService.findAllWithDetails();

        return users.map((user) => ({
            ...mapUserToAuthResponse(user),
            isActive: user.isActive,
        }));
    }

    listStaffDepartments() {
        return this.departmentsService.listStaffDepartments();
    }

    async getUser(id: number): Promise<AdminUserResponse> {
        const user = await this.usersService.findByIdWithDetails(id);

        return {
            ...mapUserToAuthResponse(user),
            isActive: user.isActive,
        };
    }

    async updateUser(
        id: number,
        dto: UpdateUserDto,
        currentUserId: number,
        photo?: Express.Multer.File,
    ): Promise<AdminUserResponse> {
        const user = await this.usersService.findByIdWithDetails(id);
        const trimmedLogin = dto.login.trim();

        if (id === currentUserId) {
            if (dto.role !== RoleCode.ADMIN) {
                throw new BadRequestException(
                    'Нельзя изменить собственную роль',
                );
            }

            if (dto.isActive === false) {
                throw new BadRequestException(
                    'Нельзя деактивировать собственную учётную запись',
                );
            }
        }

        if (trimmedLogin !== user.login) {
            const existingUser =
                await this.usersService.findByLogin(trimmedLogin);

            if (existingUser && existingUser.id !== id) {
                throw new ConflictException(
                    'Пользователь с таким логином уже существует',
                );
            }
        }

        const role = await this.roleRepository.findOne({
            where: { code: dto.role },
        });

        if (!role) {
            throw new BadRequestException(
                `Роль ${dto.role} не найдена в системе`,
            );
        }

        this.validateProfileFields(dto);

        const updateData: {
            login: string;
            roleId: number;
            surname: string;
            name: string;
            patronymic: string;
            photoUrl: string | null;
            isActive: boolean;
            passwordHash?: string;
        } = {
            login: trimmedLogin,
            roleId: role.id,
            surname: dto.surname.trim(),
            name: dto.name.trim(),
            patronymic: dto.patronymic?.trim() || '',
            photoUrl: user.photoUrl,
            isActive: dto.isActive ?? user.isActive,
        };

        if (dto.password?.trim()) {
            updateData.passwordHash = await bcrypt.hash(
                dto.password.trim(),
                10,
            );
        }

        if (photo) {
            updateData.photoUrl = await this.avatarService.saveAvatar(
                id,
                photo,
                user.photoUrl,
            );
        } else if (dto.removePhoto) {
            await this.avatarService.deleteAvatar(id, user.photoUrl);
            updateData.photoUrl = null;
        }

        await this.usersService.update(id, updateData);

        const willBeActive = updateData.isActive;

        if (user.isActive && !willBeActive) {
            await this.revokeUserSessions(id);
        }

        if (user.role.code !== dto.role) {
            await this.removeAllProfiles(id);
            await this.createProfile(id, dto);
        } else {
            await this.updateProfile(id, dto);
        }

        const updatedUser =
            await this.usersService.findByIdWithDetails(id);

        return {
            ...mapUserToAuthResponse(updatedUser),
            isActive: updatedUser.isActive,
        };
    }

    async createUser(
        dto: CreateUserDto,
        photo?: Express.Multer.File,
    ): Promise<AdminUserResponse> {
        const existingUser = await this.usersService.findByLogin(dto.login);

        if (existingUser) {
            throw new ConflictException(
                'Пользователь с таким логином уже существует',
            );
        }

        const role = await this.roleRepository.findOne({
            where: { code: dto.role },
        });

        if (!role) {
            throw new BadRequestException(
                `Роль ${dto.role} не найдена в системе`,
            );
        }

        this.validateProfileFields(dto);

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.usersService.create({
            login: dto.login.trim(),
            passwordHash,
            roleId: role.id,
            surname: dto.surname.trim(),
            name: dto.name.trim(),
            patronymic: dto.patronymic?.trim() || '',
            photoUrl: null,
            isActive: true,
        });

        await this.createProfile(user.id, dto);

        if (photo) {
            const photoUrl = await this.avatarService.saveAvatar(
                user.id,
                photo,
            );

            await this.usersService.update(user.id, { photoUrl });
        }

        const createdUser =
            await this.usersService.findByIdWithDetails(user.id);

        return {
            ...mapUserToAuthResponse(createdUser),
            isActive: createdUser.isActive,
        };
    }

    async deleteUser(id: number, currentUserId: number): Promise<{ success: true }> {
        if (id === currentUserId) {
            throw new BadRequestException(
                'Нельзя удалить собственную учётную запись',
            );
        }

        const user = await this.usersService.findByIdWithDetails(id);
        await this.cleanupUserReferences(id);
        await this.avatarService.deleteAvatar(id, user.photoUrl);

        try {
            await this.usersService.remove(id);
        } catch (error) {
            this.rethrowUserDeleteError(error);
        }

        return { success: true };
    }

    private async cleanupUserReferences(userId: number): Promise<void> {
        const uploadsCount = await this.scheduleUploadsRepository.count({
            where: { uploadedById: userId },
        });

        if (uploadsCount > 0) {
            throw new BadRequestException(
                'Нельзя удалить пользователя: у него есть загруженные файлы расписания',
            );
        }

        await this.consultationsRepository.delete({ teacherId: userId });
        await this.scheduleItemsRepository.update(
            { teacherId: userId },
            { teacherId: null },
        );
        await this.schedulesRepository.update(
            { teacherId: userId },
            { teacherId: null },
        );

        const preferences = await this.consultationPreferencesRepository
            .createQueryBuilder('preference')
            .where('preference.teacherIds @> :teacherIds::jsonb', {
                teacherIds: JSON.stringify([userId]),
            })
            .getMany();

        for (const preference of preferences) {
            preference.teacherIds = preference.teacherIds.filter(
                (teacherId) => teacherId !== userId,
            );
            await this.consultationPreferencesRepository.save(preference);
        }
    }

    private rethrowUserDeleteError(error: unknown): never {
        if (
            error instanceof QueryFailedError
            && (error.driverError as { code?: string }).code === '23503'
        ) {
            throw new BadRequestException(
                'Нельзя удалить пользователя: на него есть ссылки в других данных системы',
            );
        }

        throw error;
    }

    async listActiveSessions(): Promise<AdminSessionResponse[]> {
        return this.sessionsService.listActiveSessions();
    }

    async revokeSession(id: number): Promise<{ success: true }> {
        const session = await this.refreshTokenRepository.findOne({
            where: { id, isActive: true },
        });

        if (!session) {
            throw new NotFoundException('Активная сессия не найдена');
        }

        await this.refreshTokenRepository.update(
            { id },
            { isActive: false },
        );

        this.sessionsNotifier.notifySessionRemoved(id);

        return { success: true };
    }

    private async revokeUserSessions(userId: number): Promise<void> {
        await this.sessionsNotifier.notifyUserSessionsRemoved(userId);

        await this.refreshTokenRepository.update(
            { userId, isActive: true },
            { isActive: false },
        );
    }

    private validateProfileFields(dto: {
        role: RoleCode;
        group?: string;
        direction?: string;
        course?: number;
        departmentId?: number;
        department?: string;
        position?: string;
    }): void {
        if (dto.role === RoleCode.STUDENT) {
            if (!dto.group?.trim() || !dto.direction?.trim() || !dto.course) {
                throw new BadRequestException(
                    'Для студента нужны группа, направление и курс',
                );
            }

            const directionValidation = validateDirectionInput(dto.direction);

            if (!directionValidation.valid) {
                throw new BadRequestException(directionValidation.message);
            }
        }

        if (dto.role === RoleCode.TEACHER) {
            if (!dto.position?.trim() || !dto.departmentId) {
                throw new BadRequestException(
                    'Для преподавателя нужны должность и кафедра',
                );
            }
        }

        if (
            dto.role === RoleCode.EMPLOYEE ||
            dto.role === RoleCode.ADMIN
        ) {
            if (!dto.departmentId && !dto.department?.trim()) {
                throw new BadRequestException(
                    'Укажите структурное подразделение',
                );
            }

            if (
                dto.role === RoleCode.EMPLOYEE &&
                !dto.position?.trim()
            ) {
                throw new BadRequestException(
                    'Для сотрудника нужна должность',
                );
            }
        }
    }

    private async createProfile(
        userId: number,
        dto: CreateUserDto | UpdateUserDto,
    ): Promise<void> {
        switch (dto.role) {
            case RoleCode.STUDENT:
                await this.createStudentProfile(userId, dto);
                return;

            case RoleCode.TEACHER:
                await this.createTeacherProfile(userId, dto);
                return;

            case RoleCode.ADMIN:
            case RoleCode.EMPLOYEE:
                await this.createStaffProfile(userId, dto);
                return;
        }
    }

    private async createStudentProfile(
        userId: number,
        dto: CreateUserDto | UpdateUserDto,
    ): Promise<void> {
        const direction = await this.findOrCreateDirection(dto.direction!.trim());
        const educationForm = this.mapEducationForm(dto.educationForm);
        const group = await this.findOrCreateGroup(
            dto.group!.trim(),
            direction.id,
            educationForm,
        );

        await this.studentProfileRepository.save({
            userId,
            groupId: group.id,
            subgroupId: null,
            course: dto.course!,
            educationForm,
        });
    }

    private async createTeacherProfile(
        userId: number,
        dto: CreateUserDto | UpdateUserDto,
    ): Promise<void> {
        const department = await this.departmentsService.resolveTeacherDepartmentId(
            dto.departmentId!,
        );

        await this.teacherProfileRepository.save({
            userId,
            departmentId: department.id,
            position: dto.position!.trim(),
            cabinet: dto.cabinet?.trim() || null,
        });
    }

    private async resolveStaffDepartment(
        dto: CreateUserDto | UpdateUserDto,
    ): Promise<Department> {
        if (dto.departmentId) {
            const department = await this.departmentRepository.findOne({
                where: { id: dto.departmentId },
            });

            if (department) {
                return department;
            }
        }

        return this.departmentsService.resolveDepartmentByInput(dto.department!.trim());
    }

    private async createStaffProfile(
        userId: number,
        dto: CreateUserDto | UpdateUserDto,
    ): Promise<void> {
        const department = await this.resolveStaffDepartment(dto);

        await this.staffProfileRepository.save({
            userId,
            departmentId: department.id,
            position: dto.position?.trim() || 'Администратор',
            cabinet: dto.cabinet?.trim() || null,
        });
    }

    private async updateProfile(
        userId: number,
        dto: UpdateUserDto,
    ): Promise<void> {
        switch (dto.role) {
            case RoleCode.STUDENT: {
                const profile = await this.studentProfileRepository.findOne({
                    where: { userId },
                });

                if (!profile) {
                    await this.createStudentProfile(userId, dto);
                    return;
                }

                const direction = await this.findOrCreateDirection(
                    dto.direction!.trim(),
                );
                const educationForm = this.mapEducationForm(dto.educationForm);
                const group = await this.findOrCreateGroup(
                    dto.group!.trim(),
                    direction.id,
                    educationForm,
                );

                await this.studentProfileRepository.update(profile.id, {
                    groupId: group.id,
                    course: dto.course!,
                    educationForm,
                });
                return;
            }

            case RoleCode.TEACHER: {
                const profile = await this.teacherProfileRepository.findOne({
                    where: { userId },
                });

                if (!profile) {
                    await this.createTeacherProfile(userId, dto);
                    return;
                }

                const department = await this.departmentsService.resolveTeacherDepartmentId(
                    dto.departmentId!,
                );

                await this.teacherProfileRepository.update(profile.id, {
                    departmentId: department.id,
                    position: dto.position!.trim(),
                    cabinet: dto.cabinet?.trim() || null,
                });
                return;
            }

            case RoleCode.ADMIN:
            case RoleCode.EMPLOYEE: {
                const profile = await this.staffProfileRepository.findOne({
                    where: { userId },
                });

                if (!profile) {
                    await this.createStaffProfile(userId, dto);
                    return;
                }

                const department = await this.resolveStaffDepartment(dto);

                await this.staffProfileRepository.update(profile.id, {
                    departmentId: department.id,
                    position: dto.position?.trim() || 'Администратор',
                    cabinet: dto.cabinet?.trim() || null,
                });
                return;
            }
        }
    }

    private async removeAllProfiles(userId: number): Promise<void> {
        await this.studentProfileRepository.delete({ userId });
        await this.teacherProfileRepository.delete({ userId });
        await this.staffProfileRepository.delete({ userId });
    }

    private async findOrCreateDepartment(name: string): Promise<Department> {
        const existing = await this.departmentRepository.findOne({
            where: { name },
        });

        if (existing) {
            return existing;
        }

        return this.departmentRepository.save({
            name,
            shortName: null,
        });
    }

    private async findOrCreateDirection(name: string): Promise<Direction> {
        const trimmed = name.trim();
        const validation = validateDirectionInput(trimmed);

        if (!validation.valid) {
            throw new BadRequestException(validation.message);
        }

        const displayName = buildDirectionDisplayName(trimmed);
        const storageCode = buildDirectionStorageCode(trimmed);

        const existingByCode = await this.directionRepository.findOne({
            where: { code: storageCode },
        });

        if (existingByCode) {
            if (existingByCode.name !== displayName) {
                existingByCode.name = displayName;
                await this.directionRepository.save(existingByCode);
            }

            return existingByCode;
        }

        return this.directionRepository.save({
            name: displayName,
            code: storageCode,
        });
    }

    private static readonly GROUP_LEGACY_COURSE = 1;

    private async findOrCreateGroup(
        name: string,
        directionId: number,
        educationForm: EducationForm,
    ): Promise<Group> {
        const existing = await this.groupRepository.findOne({
            where: {
                name,
                directionId,
                educationForm,
            },
        });

        if (existing) {
            return existing;
        }

        return this.groupRepository.save({
            name,
            directionId,
            course: AdminService.GROUP_LEGACY_COURSE,
            educationForm,
        });
    }

    private mapEducationForm(label?: string): EducationForm {
        switch (label?.trim()) {
            case 'Заочная':
                return EducationForm.PART_TIME;
            case 'Дистанционная':
                return EducationForm.DISTANCE;
            case 'Очно-заочная':
                return EducationForm.PART_TIME;
            default:
                return EducationForm.FULL_TIME;
        }
    }

    private formatFullName(user: {
        surname: string;
        name: string;
        patronymic: string;
    }): string {
        const patronymicInitial = user.patronymic
            ? ` ${user.patronymic.charAt(0)}.`
            : '';

        return `${user.surname} ${user.name.charAt(0)}.${patronymicInitial}`.trim();
    }
}
