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

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {}

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
            .map((department) => this.mapDepartment(department));
    }

    async resolveTeacherDepartmentId(departmentId: number): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });

        if (!department?.shortName?.trim()) {
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
