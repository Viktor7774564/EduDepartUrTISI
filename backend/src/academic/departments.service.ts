import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { Department } from './entities/department.entity';
import { formatTeacherDepartmentLabel } from './teacher-departments.constants';

export interface TeacherDepartmentInfo {
    id: number;
    shortName: string;
    name: string;
    label: string;
}

export interface StaffDepartmentInfo {
    id: number;
    name: string;
}

@Injectable()
export class DepartmentsService {
    private static readonly STAFF_DEPARTMENT_MARKERS = ['учебный отдел'];

    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {}

    private isStaffDepartment(department: Department): boolean {
        const normalizedName = department.name.trim().toLowerCase();

        if (
            DepartmentsService.STAFF_DEPARTMENT_MARKERS.some((marker) =>
                normalizedName.includes(marker),
            )
        ) {
            return true;
        }

        return !department.shortName?.trim();
    }

    private mapDepartment(department: Department): TeacherDepartmentInfo {
        return {
            id: department.id,
            shortName: department.shortName ?? '',
            name: department.name,
            label: formatTeacherDepartmentLabel({
                shortName: department.shortName ?? '',
                name: department.name,
            }),
        };
    }

    async listStaffDepartments(): Promise<StaffDepartmentInfo[]> {
        const departments = await this.departmentRepository.find({
            order: { name: 'ASC' },
        });

        return departments
            .filter((department) => this.isStaffDepartment(department))
            .map((department) => ({
                id: department.id,
                name: department.name,
            }));
    }

    async resolveStaffDepartmentId(departmentId: number): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });

        if (!department || !this.isStaffDepartment(department)) {
            throw new BadRequestException('Выберите отдел из списка');
        }

        return department;
    }

    async resolveDepartmentByInput(raw: string): Promise<Department> {
        const trimmed = raw.trim();

        if (!trimmed) {
            throw new BadRequestException('Укажите структурное подразделение');
        }

        const byExactName = await this.departmentRepository.findOne({
            where: { name: trimmed },
        });

        if (byExactName) {
            return byExactName;
        }

        const departments = await this.departmentRepository.find();

        const normalizedInput = this.normalizeDepartmentInput(trimmed);

        for (const department of departments) {
            if (department.shortName?.trim()) {
                const shortName = department.shortName.trim();

                if (shortName === trimmed || shortName.toLowerCase() === trimmed.toLowerCase()) {
                    return department;
                }

                if (this.normalizeDepartmentInput(shortName) === normalizedInput) {
                    return department;
                }
            }

            if (this.normalizeDepartmentInput(department.name) === normalizedInput) {
                return department;
            }
        }

        return this.departmentRepository.save({
            name: trimmed,
            shortName: null,
        });
    }

    private normalizeDepartmentInput(value: string): string {
        return value
            .trim()
            .toLowerCase()
            .replace(/[«»„""]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/^кафедра\s+/u, '');
    }

    async listTeacherDepartments(): Promise<TeacherDepartmentInfo[]> {
        const departments = await this.departmentRepository.find({
            where: {
                shortName: Not(IsNull()),
            },
            order: {
                shortName: 'ASC',
            },
        });

        return departments
            .filter((department) => department.shortName?.trim())
            .filter((department) => !this.isStaffDepartment(department))
            .map((department) => this.mapDepartment(department));
    }

    async resolveTeacherDepartmentId(departmentId: number): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });

        if (!department?.shortName?.trim() || this.isStaffDepartment(department)) {
            throw new BadRequestException('Выберите кафедру из списка');
        }

        return department;
    }

    async getTeacherDepartmentById(departmentId: number): Promise<TeacherDepartmentInfo> {
        const department = await this.resolveTeacherDepartmentId(departmentId);

        return this.mapDepartment(department);
    }

    async getTeacherDepartmentByShortName(shortName: string): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { shortName },
        });

        if (!department) {
            throw new NotFoundException(`Кафедра ${shortName} не найдена`);
        }

        return department;
    }
}
