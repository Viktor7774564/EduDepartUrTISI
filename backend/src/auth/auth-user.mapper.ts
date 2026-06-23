import { EducationForm } from '../academic/entities/group.entity';
import { RoleCode } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

export type AuthUserResponse = {
    id: number;
    login: string;
    role: RoleCode;
    surname: string;
    name: string;
    patronymic: string;
    photoUrl: string | null;
    group?: string;
    direction?: string;
    educationForm?: string;
    course?: number;
    position?: string;
    department?: string;
    cabinet?: string;
};

const educationFormLabels: Record<EducationForm, string> = {
    [EducationForm.FULL_TIME]: 'Очная',
    [EducationForm.PART_TIME]: 'Заочная',
    [EducationForm.DISTANCE]: 'Дистанционная',
};

export function mapUserToAuthResponse(user: User): AuthUserResponse {
    const base: AuthUserResponse = {
        id: user.id,
        login: user.login,
        role: user.role.code,
        surname: user.surname,
        name: user.name,
        patronymic: user.patronymic,
        photoUrl: user.photoUrl,
    };

    if (user.studentProfile) {
        return {
            ...base,
            group: user.studentProfile.group.name,
            direction: user.studentProfile.group.direction.name,
            educationForm: educationFormLabels[user.studentProfile.educationForm],
            course: user.studentProfile.course,
        };
    }

    if (user.teacherProfile) {
        return {
            ...base,
            position: user.teacherProfile.position,
            department: user.teacherProfile.department.name,
            cabinet: user.teacherProfile.cabinet ?? undefined,
        };
    }

    if (user.staffProfile) {
        return {
            ...base,
            position: user.staffProfile.position,
            department: user.staffProfile.department.name,
            cabinet: user.staffProfile.cabinet ?? undefined,
        };
    }

    return base;
}
