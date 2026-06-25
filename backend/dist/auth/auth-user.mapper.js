"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapUserToAuthResponse = mapUserToAuthResponse;
const group_entity_1 = require("../academic/entities/group.entity");
const educationFormLabels = {
    [group_entity_1.EducationForm.FULL_TIME]: 'Очная',
    [group_entity_1.EducationForm.PART_TIME]: 'Заочная',
    [group_entity_1.EducationForm.DISTANCE]: 'Дистанционная',
};
function mapUserToAuthResponse(user) {
    const base = {
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
            departmentId: user.teacherProfile.departmentId,
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
//# sourceMappingURL=auth-user.mapper.js.map