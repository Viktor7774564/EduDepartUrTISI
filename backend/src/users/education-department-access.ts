import { RoleCode } from './entities/role.entity';
import { User } from './entities/user.entity';

const EDUCATION_DEPARTMENT_NAME = 'учебный отдел';

export function normalizeDepartmentName(name?: string | null): string {
    return name?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

export function isEducationDepartmentName(name?: string | null): boolean {
    return normalizeDepartmentName(name).includes(EDUCATION_DEPARTMENT_NAME);
}

export function canManageSchedule(user: User): boolean {
    if (user.role.code !== RoleCode.EMPLOYEE || !user.staffProfile?.department) {
        return false;
    }

    return isEducationDepartmentName(user.staffProfile.department.name);
}
