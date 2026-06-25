import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Department } from './entities/department.entity';
import { TEACHER_DEPARTMENTS } from './teacher-departments.constants';

@Injectable()
export class DepartmentsSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {}

    async onModuleInit() {
        for (const item of TEACHER_DEPARTMENTS) {
            const existing = await this.departmentRepository.findOne({
                where: { shortName: item.shortName },
            });

            if (existing) {
                if (existing.name !== item.name) {
                    existing.name = item.name;
                    await this.departmentRepository.save(existing);
                }
                continue;
            }

            await this.departmentRepository.save({
                shortName: item.shortName,
                name: item.name,
            });
        }
    }
}
