import { RoleCode } from '../../users/entities/role.entity';

export interface SeedUserDefinition {
    envLoginKey: string;
    envPasswordKey: string;
    defaultLogin: string;
    role: RoleCode;
    surname: string;
    name: string;
    patronymic: string;
    departmentName: string;
    position: string;
}

export const SEED_USERS: SeedUserDefinition[] = [
    {
        envLoginKey: 'SEED_ADMIN_LOGIN',
        envPasswordKey: 'SEED_ADMIN_PASSWORD',
        defaultLogin: 'admin',
        role: RoleCode.ADMIN,
        surname: 'Админ',
        name: 'Системный',
        patronymic: 'Администратор',
        departmentName: 'Администрация',
        position: 'Администратор',
    },
    {
        envLoginKey: 'SEED_EDU_DEPART_LOGIN',
        envPasswordKey: 'SEED_EDU_DEPART_PASSWORD',
        defaultLogin: 'edu_depart',
        role: RoleCode.EMPLOYEE,
        surname: 'Сотрудник',
        name: 'Учебного',
        patronymic: 'Отдела',
        departmentName: 'Учебный отдел',
        position: 'Специалист учебного отдела',
    },
];
