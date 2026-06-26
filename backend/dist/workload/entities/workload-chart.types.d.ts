export interface ParsedWorkloadRow {
    groupName: string;
    subject: string;
    lessonType: string;
    semester: 1 | 2;
    plannedHours: number;
    teacherName?: string | null;
}
export interface ParseWorkloadResult {
    academicYear: string;
    course: number | null;
    groupNames: string[];
    rows: ParsedWorkloadRow[];
    warnings: string[];
    errors: string[];
}
