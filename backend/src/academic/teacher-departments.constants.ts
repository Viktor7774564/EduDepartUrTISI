export interface TeacherDepartmentDefinition {
    shortName: string;
    name: string;
}

export const TEACHER_DEPARTMENTS: TeacherDepartmentDefinition[] = [
    {
        shortName: 'ИТиМС',
        name: 'Кафедра «Инфокоммуникационных технологий и мобильной связи»',
    },
    {
        shortName: 'ИСТ',
        name: 'Кафедра «Информационных систем и технологий»',
    },
    {
        shortName: 'МЭС',
        name: 'Кафедра «Многоканальная электросвязь»',
    },
    {
        shortName: 'ВМиФ',
        name: 'Кафедра «Высшей математики и физики»',
    },
    {
        shortName: 'ГиСЭД',
        name: 'Кафедра гуманитарных и социально-экономических дисциплин',
    },
];

export function formatTeacherDepartmentLabel(
    department: Pick<TeacherDepartmentDefinition, 'shortName' | 'name'>,
): string {
    return `Кафедра ${department.shortName} — ${department.name}`;
}
