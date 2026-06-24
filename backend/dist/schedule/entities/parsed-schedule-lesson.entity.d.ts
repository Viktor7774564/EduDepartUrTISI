import { ScheduleUpload } from './schedule-upload.entity';
export declare class ParsedScheduleLesson {
    id: number;
    uploadId: number;
    upload: ScheduleUpload;
    groupName: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekStart: string;
    subgroup: number | null;
    subject: string;
    lessonType: string;
    teacherPosition: string | null;
    teacherName: string;
    room: string | null;
    isDistance: boolean;
    isSameCellParallel: boolean;
}
