import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Department } from '../academic/entities/department.entity';
import { Direction } from '../academic/entities/direction.entity';
import { EducationForm, Group } from '../academic/entities/group.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';
import {
    buildDirectionDisplayName,
    buildDirectionStorageCode,
    validateDirectionInput,
} from '../academic/direction.utils';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateTeacherDepartmentDto } from './dto/create-teacher-department.dto';
import { CreateStaffDepartmentDto } from './dto/create-staff-department.dto';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { StaffProfile } from '../users/entities/staff-profile.entity';
import { RoleCode } from '../users/entities/role.entity';

export type AcademicMember = {
    id: number;
    login: string;
    fullName: string;
    role: RoleCode;
    position: string;
    cabinet: string | null;
    isActive: boolean;
};

export type AcademicDepartment = {
    id: number;
    name: string;
    shortName: string | null;
    type: 'teacher' | 'staff';
    headUserId: number | null;
    headFullName: string | null;
    members: AcademicMember[];
};

export type AcademicGroup = {
    id: number;
    name: string;
    educationForm: EducationForm;
    directionId: number;
    directionName: string;
    students: AcademicMember[];
};

export type AcademicDirection = {
    id: number;
    code: string;
    name: string;
    groups: AcademicGroup[];
};

export type AcademicStructureOverview = {
    teacherDepartments: AcademicDepartment[];
    staffDepartments: AcademicDepartment[];
    directions: AcademicDirection[];
};

@Injectable()
export class AdminAcademicService {
    private static readonly STAFF_DEPARTMENT_MARKERS = ['учебный отдел'];
    private static readonly IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';

    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,

        @InjectRepository(Direction)
        private readonly directionRepository: Repository<Direction>,

        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,

        @InjectRepository(Subgroup)
        private readonly subgroupRepository: Repository<Subgroup>,

        @InjectRepository(StudentProfile)
        private readonly studentProfileRepository: Repository<StudentProfile>,

        @InjectRepository(Schedule)
        private readonly scheduleRepository: Repository<Schedule>,

        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,

        @InjectRepository(TeacherProfile)
        private readonly teacherProfileRepository: Repository<TeacherProfile>,

        @InjectRepository(StaffProfile)
        private readonly staffProfileRepository: Repository<StaffProfile>,
    ) {}

    async getOverview(): Promise<AcademicStructureOverview> {
        const departments = await this.departmentRepository.find({
            relations: {
                headUser: true,
                teacherProfiles: {
                    user: {
                        role: true,
                    },
                },
                staffProfiles: {
                    user: {
                        role: true,
                    },
                },
            },
            order: { name: 'ASC' },
        });

        const teacherDepartments: AcademicDepartment[] = [];
        const staffDepartments: AcademicDepartment[] = [];

        for (const department of departments) {
            const isTeacherDepartment = this.isTeacherDepartment(department);
            const mapped = this.mapDepartment(department, isTeacherDepartment);

            mapped.members.sort((left, right) =>
                left.fullName.localeCompare(right.fullName, 'ru', {
                    sensitivity: 'base',
                }),
            );

            if (isTeacherDepartment) {
                teacherDepartments.push(mapped);
            } else {
                staffDepartments.push(mapped);
            }
        }

        teacherDepartments.sort((left, right) =>
            (left.shortName ?? left.name).localeCompare(
                right.shortName ?? right.name,
                'ru',
                { sensitivity: 'base' },
            ),
        );

        const directions = await this.directionRepository.find({
            relations: {
                groups: {
                    studentProfiles: {
                        user: {
                            role: true,
                        },
                    },
                },
            },
            order: { name: 'ASC' },
        });

        return {
            teacherDepartments,
            staffDepartments,
            directions: directions
                .filter((direction) =>
                    direction.code !== AdminAcademicService.IMPORT_DIRECTION_CODE,
                )
                .map((direction) => ({
                    id: direction.id,
                    code: direction.code,
                    name: direction.name,
                    groups: direction.groups
                        .map((group) => ({
                            id: group.id,
                            name: group.name,
                            educationForm: group.educationForm,
                            directionId: direction.id,
                            directionName: direction.name,
                            students: group.studentProfiles
                                .map((profile) => this.mapStudentMember(profile))
                                .sort((left, right) =>
                                    left.fullName.localeCompare(right.fullName, 'ru', {
                                        sensitivity: 'base',
                                    }),
                                ),
                        }))
                        .sort((left, right) =>
                            left.name.localeCompare(right.name, 'ru', {
                                sensitivity: 'base',
                            }),
                        ),
                })),
        };
    }

    async setDepartmentHead(
        departmentId: number,
        headUserId: number | null,
    ): Promise<AcademicDepartment> {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
            relations: {
                headUser: true,
                teacherProfiles: {
                    user: {
                        role: true,
                    },
                },
                staffProfiles: {
                    user: {
                        role: true,
                    },
                },
            },
        });

        if (!department) {
            throw new NotFoundException('Подразделение не найдено');
        }

        const isTeacherDepartment = this.isTeacherDepartment(department);

        if (headUserId === null) {
            department.headUserId = null;
            await this.departmentRepository.save(department);
            return this.mapDepartment(department, isTeacherDepartment);
        }

        const user = await this.usersRepository.findOne({
            where: { id: headUserId },
            relations: { role: true },
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        if (isTeacherDepartment) {
            const teacherProfile = await this.teacherProfileRepository.findOne({
                where: {
                    userId: headUserId,
                    departmentId,
                },
            });

            if (!teacherProfile) {
                throw new BadRequestException(
                    'Руководителем кафедры может быть только преподаватель этой кафедры',
                );
            }
        } else {
            const staffProfile = await this.staffProfileRepository.findOne({
                where: {
                    userId: headUserId,
                    departmentId,
                },
            });

            if (!staffProfile) {
                throw new BadRequestException(
                    'Руководителем отдела может быть только сотрудник этого отдела',
                );
            }
        }

        department.headUserId = headUserId;
        department.headUser = user;
        await this.departmentRepository.save(department);

        return this.mapDepartment(department, isTeacherDepartment);
    }

    async createTeacherDepartment(
        dto: CreateTeacherDepartmentDto,
    ): Promise<AcademicDepartment> {
        const name = dto.name.trim();
        const shortName = dto.shortName.trim();

        if (
            AdminAcademicService.STAFF_DEPARTMENT_MARKERS.some((marker) =>
                name.toLowerCase().includes(marker),
            )
        ) {
            throw new BadRequestException('Кафедра не может называться как отдел');
        }

        const existingByShortName = await this.departmentRepository.findOne({
            where: { shortName },
        });

        if (existingByShortName) {
            throw new ConflictException('Кафедра с таким сокращением уже существует');
        }

        const existingByName = await this.departmentRepository.findOne({
            where: { name },
        });

        if (existingByName) {
            throw new ConflictException('Кафедра с таким названием уже существует');
        }

        const department = await this.departmentRepository.save({
            name,
            shortName,
            headUserId: null,
        });

        department.teacherProfiles = [];
        department.staffProfiles = [];

        return this.mapDepartment(department, true);
    }

    async createStaffDepartment(
        dto: CreateStaffDepartmentDto,
    ): Promise<AcademicDepartment> {
        const name = dto.name.trim();

        const existingByName = await this.departmentRepository.findOne({
            where: { name },
        });

        if (existingByName) {
            throw new ConflictException('Отдел с таким названием уже существует');
        }

        const department = await this.departmentRepository.save({
            name,
            shortName: null,
            headUserId: null,
        });

        department.teacherProfiles = [];
        department.staffProfiles = [];

        return this.mapDepartment(department, false);
    }

    async createDirection(dto: CreateDirectionDto): Promise<AcademicDirection> {
        const trimmed = dto.name.trim();
        const validation = validateDirectionInput(trimmed);

        if (!validation.valid) {
            throw new BadRequestException(validation.message);
        }

        const displayName = buildDirectionDisplayName(trimmed);
        const storageCode = buildDirectionStorageCode(trimmed);

        if (storageCode === AdminAcademicService.IMPORT_DIRECTION_CODE) {
            throw new BadRequestException('Недопустимое название направления');
        }

        const existingByCode = await this.directionRepository.findOne({
            where: { code: storageCode },
        });

        if (existingByCode) {
            throw new ConflictException('Направление с таким кодом уже существует');
        }

        const direction = await this.directionRepository.save({
            name: displayName,
            code: storageCode,
        });

        return this.mapDirection(direction, []);
    }

    async createGroup(
        directionId: number,
        dto: CreateGroupDto,
    ): Promise<AcademicGroup> {
        const direction = await this.directionRepository.findOne({
            where: { id: directionId },
        });

        if (!direction) {
            throw new NotFoundException('Направление не найдено');
        }

        if (direction.code === AdminAcademicService.IMPORT_DIRECTION_CODE) {
            throw new BadRequestException('Нельзя добавлять группы в служебное направление');
        }

        const groupName = dto.name.trim();
        const existing = await this.groupRepository.findOne({
            where: {
                name: groupName,
                directionId,
                educationForm: dto.educationForm,
            },
        });

        if (existing) {
            throw new ConflictException('Такая группа уже существует в этом направлении');
        }

        const group = await this.groupRepository.save({
            name: groupName,
            directionId,
            course: 1,
            educationForm: dto.educationForm,
        });

        return {
            id: group.id,
            name: group.name,
            educationForm: group.educationForm,
            directionId: direction.id,
            directionName: direction.name,
            students: [],
        };
    }

    async deleteGroup(groupId: number): Promise<{ success: true }> {
        const group = await this.groupRepository.findOne({
            where: { id: groupId },
            relations: { studentProfiles: true },
        });

        if (!group) {
            throw new NotFoundException('Группа не найдена');
        }

        if (group.studentProfiles.length > 0) {
            throw new BadRequestException(
                'Нельзя удалить группу: в ней есть студенты',
            );
        }

        const schedulesCount = await this.scheduleRepository.count({
            where: { groupId },
        });

        if (schedulesCount > 0) {
            throw new BadRequestException(
                'Нельзя удалить группу: к ней привязано расписание',
            );
        }

        await this.subgroupRepository.delete({ groupId });
        await this.groupRepository.delete(groupId);

        return { success: true };
    }

    async deleteDirection(directionId: number): Promise<{ success: true }> {
        const direction = await this.directionRepository.findOne({
            where: { id: directionId },
            relations: { groups: { studentProfiles: true } },
        });

        if (!direction) {
            throw new NotFoundException('Направление не найдено');
        }

        if (direction.code === AdminAcademicService.IMPORT_DIRECTION_CODE) {
            throw new BadRequestException('Это служебное направление удалить нельзя');
        }

        for (const group of direction.groups) {
            if (group.studentProfiles.length > 0) {
                throw new BadRequestException(
                    'Нельзя удалить направление: в его группах есть студенты',
                );
            }

            const schedulesCount = await this.scheduleRepository.count({
                where: { groupId: group.id },
            });

            if (schedulesCount > 0) {
                throw new BadRequestException(
                    'Нельзя удалить направление: к его группам привязано расписание',
                );
            }
        }

        for (const group of direction.groups) {
            await this.subgroupRepository.delete({ groupId: group.id });
        }

        await this.groupRepository.delete({ directionId });
        await this.directionRepository.delete(directionId);

        return { success: true };
    }

    async deleteDepartment(departmentId: number): Promise<{ success: true }> {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
            relations: {
                teacherProfiles: true,
                staffProfiles: true,
            },
        });

        if (!department) {
            throw new NotFoundException('Подразделение не найдено');
        }

        const isTeacherDepartment = this.isTeacherDepartment(department);

        if (department.teacherProfiles.length > 0) {
            throw new BadRequestException(
                'Нельзя удалить кафедру: на ней есть преподаватели',
            );
        }

        if (department.staffProfiles.length > 0) {
            throw new BadRequestException(
                'Нельзя удалить отдел: в нём есть сотрудники',
            );
        }

        await this.departmentRepository.delete(departmentId);

        return { success: true };
    }

    async mergeDirections(
        sourceDirectionId: number,
        targetDirectionId: number,
    ): Promise<{ success: true }> {
        if (sourceDirectionId === targetDirectionId) {
            throw new BadRequestException('Нельзя объединить направление с самим собой');
        }

        const source = await this.directionRepository.findOne({
            where: { id: sourceDirectionId },
            relations: { groups: true },
        });

        const target = await this.directionRepository.findOne({
            where: { id: targetDirectionId },
            relations: { groups: true },
        });

        if (!source || !target) {
            throw new NotFoundException('Направление не найдено');
        }

        if (source.code === AdminAcademicService.IMPORT_DIRECTION_CODE) {
            throw new BadRequestException('Служебное направление объединить нельзя');
        }

        for (const sourceGroup of source.groups) {
            const targetGroup = target.groups.find((group) =>
                group.name === sourceGroup.name
                && group.educationForm === sourceGroup.educationForm,
            );

            if (targetGroup) {
                await this.studentProfileRepository.update(
                    { groupId: sourceGroup.id },
                    { groupId: targetGroup.id },
                );

                await this.scheduleRepository.update(
                    { groupId: sourceGroup.id },
                    { groupId: targetGroup.id },
                );

                await this.subgroupRepository.delete({ groupId: sourceGroup.id });
                await this.groupRepository.delete(sourceGroup.id);
            } else {
                await this.groupRepository.update(sourceGroup.id, {
                    directionId: targetDirectionId,
                });
            }
        }

        await this.directionRepository.delete(sourceDirectionId);

        return { success: true };
    }

    private isTeacherDepartment(department: Department): boolean {
        const normalizedName = department.name.trim().toLowerCase();

        if (
            AdminAcademicService.STAFF_DEPARTMENT_MARKERS.some((marker) =>
                normalizedName.includes(marker),
            )
        ) {
            return false;
        }

        if (!department.shortName?.trim()) {
            return false;
        }

        return true;
    }

    private mapDepartment(
        department: Department,
        isTeacherDepartment: boolean,
    ): AcademicDepartment {
        const members = isTeacherDepartment
            ? [
                ...department.teacherProfiles.map((profile) =>
                    this.mapTeacherMember(profile),
                ),
                ...department.staffProfiles.map((profile) =>
                    this.mapStaffMember(profile),
                ),
            ]
            : department.staffProfiles.map((profile) =>
                this.mapStaffMember(profile),
            );

        return {
            id: department.id,
            name: department.name,
            shortName: department.shortName,
            type: isTeacherDepartment ? 'teacher' : 'staff',
            headUserId: department.headUserId,
            headFullName: department.headUser
                ? this.formatFullName(department.headUser)
                : null,
            members,
        };
    }

    private mapTeacherMember(profile: TeacherProfile): AcademicMember {
        return {
            id: profile.user.id,
            login: profile.user.login,
            fullName: this.formatFullName(profile.user),
            role: profile.user.role.code,
            position: profile.position,
            cabinet: profile.cabinet,
            isActive: profile.user.isActive,
        };
    }

    private mapStaffMember(profile: StaffProfile): AcademicMember {
        return {
            id: profile.user.id,
            login: profile.user.login,
            fullName: this.formatFullName(profile.user),
            role: profile.user.role.code,
            position: profile.position,
            cabinet: profile.cabinet,
            isActive: profile.user.isActive,
        };
    }

    private mapStudentMember(profile: {
        user: User & { role: { code: RoleCode } };
        course: number;
    }): AcademicMember {
        return {
            id: profile.user.id,
            login: profile.user.login,
            fullName: this.formatFullName(profile.user),
            role: profile.user.role.code,
            position: `Курс ${profile.course}`,
            cabinet: null,
            isActive: profile.user.isActive,
        };
    }

    private mapDirection(
        direction: Direction,
        groups: AcademicGroup[],
    ): AcademicDirection {
        return {
            id: direction.id,
            code: direction.code,
            name: direction.name,
            groups,
        };
    }

    private formatFullName(user: {
        surname: string;
        name: string;
        patronymic: string;
    }): string {
        return [user.surname, user.name, user.patronymic]
            .filter(Boolean)
            .join(' ');
    }
}
