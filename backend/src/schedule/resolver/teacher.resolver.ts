import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { RoleCode } from '../../users/entities/role.entity';

interface ParsedTeacherName {
    surname: string;
    nameInitial: string;
    patronymicInitial: string;
}

@Injectable()
export class TeacherResolver {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) {}

    private parseTeacherName(raw: string): ParsedTeacherName | null {
        const trimmed = raw.trim().replace(/\s+/g, ' ');
        const match = trimmed.match(/^([А-ЯЁ][а-яё-]+)\s+([А-ЯЁ])\.?\s*([А-ЯЁ])\.?\.?$/u);

        if (!match) {
            return null;
        }

        return {
            surname: match[1],
            nameInitial: match[2],
            patronymicInitial: match[3],
        };
    }

    private buildQuery(parsed: ParsedTeacherName, teachersOnly: boolean) {
        const qb = this.usersRepository
            .createQueryBuilder('user')
            .where('user.surname ILIKE :surname', { surname: parsed.surname })
            .andWhere('LEFT(user.name, 1) ILIKE :nameInitial', {
                nameInitial: parsed.nameInitial,
            })
            .andWhere('LEFT(user.patronymic, 1) ILIKE :patronymicInitial', {
                patronymicInitial: parsed.patronymicInitial,
            });

        if (teachersOnly) {
            qb.innerJoin('user.role', 'role').andWhere('role.code = :role', {
                role: RoleCode.TEACHER,
            });
        }

        return qb;
    }

    async resolve(rawTeacherName: string): Promise<User | null> {
        const parsed = this.parseTeacherName(rawTeacherName);

        if (!parsed) {
            return null;
        }

        let users = await this.buildQuery(parsed, true).getMany();

        if (users.length === 0) {
            users = await this.buildQuery(parsed, false).getMany();
        }

        if (users.length === 0) {
            return null;
        }

        return users[0];
    }
}
