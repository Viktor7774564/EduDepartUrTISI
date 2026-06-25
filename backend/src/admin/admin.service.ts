import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
import { AdminSessionResponse } from '../sessions/sessions.types';
import { SessionsService } from '../sessions/sessions.service';
import { SessionsNotifierService } from '../sessions/sessions-notifier.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AvatarService } from '../uploads/avatar.service';

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
    ) {}

    async listUsers(): Promise<AdminUserResponse[]> {
        const users = await this.usersService.findAllWithDetails();

        return users.map((user) => ({
            ...mapUserToAuthResponse(user),
            isActive: user.isActive,
        }));
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
        await this.avatarService.deleteAvatar(id, user.photoUrl);
        await this.usersService.remove(id);

        return { success: true };
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
        }

        if (dto.role === RoleCode.TEACHER) {
            if (!dto.position?.trim() || !dto.departmentId) {
                throw new BadRequestException(
                    'Для преподавателя нужны должность и кафедра',
                );
            }
        }

        if (
            dto.role === RoleCode.EDUCATION_DEPARTMENT ||
            dto.role === RoleCode.ADMIN
        ) {
            if (!dto.department?.trim()) {
                throw new BadRequestException(
                    'Укажите структурное подразделение',
                );
            }

            if (
                dto.role === RoleCode.EDUCATION_DEPARTMENT &&
                !dto.position?.trim()
            ) {
                throw new BadRequestException(
                    'Для сотрудника учебного отдела нужна должность',
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
            case RoleCode.EDUCATION_DEPARTMENT:
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
            dto.course!,
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

    private async createStaffProfile(
        userId: number,
        dto: CreateUserDto | UpdateUserDto,
    ): Promise<void> {
        const department = await this.findOrCreateDepartment(
            dto.department!.trim(),
        );

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
                    dto.course!,
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
            case RoleCode.EDUCATION_DEPARTMENT: {
                const profile = await this.staffProfileRepository.findOne({
                    where: { userId },
                });

                if (!profile) {
                    await this.createStaffProfile(userId, dto);
                    return;
                }

                const department = await this.findOrCreateDepartment(
                    dto.department!.trim(),
                );

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
        const existing = await this.directionRepository.findOne({
            where: { name },
        });

        if (existing) {
            return existing;
        }

        const code = name
            .toLowerCase()
            .replace(/[^a-zа-я0-9]+/gi, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 50) || `direction_${Date.now()}`;

        return this.directionRepository.save({ name, code });
    }

    private async findOrCreateGroup(
        name: string,
        directionId: number,
        course: number,
        educationForm: EducationForm,
    ): Promise<Group> {
        const existing = await this.groupRepository.findOne({
            where: {
                name,
                directionId,
                course,
                educationForm,
            },
        });

        if (existing) {
            return existing;
        }

        return this.groupRepository.save({
            name,
            directionId,
            course,
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
