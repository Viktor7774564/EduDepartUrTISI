import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Department } from './entities/department.entity';
import {
    TEACHER_DEPARTMENTS,
    formatTeacherDepartmentLabel,
} from './teacher-departments.constants';

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
        const shortNames = TEACHER_DEPARTMENTS.map((item) => item.shortName);
        const departments = await this.departmentRepository.find({
            where: { shortName: In(shortNames) },
        });

        const order = new Map(
            TEACHER_DEPARTMENTS.map((item, index) => [item.shortName, index]),
        );

        return departments
            .sort((left, right) =>
                (order.get(left.shortName ?? '') ?? 0)
                - (order.get(right.shortName ?? '') ?? 0))
            .map((department) => this.mapDepartment(department));
    }

    async resolveTeacherDepartmentId(departmentId: number): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id: departmentId },
        });

        if (!department?.shortName) {
            throw new BadRequestException('Выберите кафедру из списка');
        }

        const isTeacherDepartment = TEACHER_DEPARTMENTS.some(
            (item) => item.shortName === department.shortName,
        );

        if (!isTeacherDepartment) {
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
