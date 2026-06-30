import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role, RoleCode } from '../users/entities/role.entity';

const DEFAULT_ROLES: Array<{ code: RoleCode; name: string }> = [
    { code: RoleCode.ADMIN, name: 'Администратор' },
    { code: RoleCode.STUDENT, name: 'Студент' },
    { code: RoleCode.TEACHER, name: 'Преподаватель' },
    { code: RoleCode.EMPLOYEE, name: 'Сотрудник' },
];

@Injectable()
export class RolesSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}

    async onModuleInit() {
        for (const role of DEFAULT_ROLES) {
            const existing = await this.roleRepository.findOne({
                where: { code: role.code },
            });

            if (!existing) {
                await this.roleRepository.save(role);
            } else if (existing.name !== role.name) {
                existing.name = role.name;
                await this.roleRepository.save(existing);
            }
        }
    }
}
