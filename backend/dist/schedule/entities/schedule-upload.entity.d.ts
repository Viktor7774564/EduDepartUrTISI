import { User } from '../../users/entities/user.entity';
import { ParsedScheduleLesson } from './parsed-schedule-lesson.entity';
import { ScheduleType } from './schedule.entity';
export declare enum ScheduleParseStatus {
    SUCCESS = "success",
    FAILED = "failed"
}
export declare class ScheduleUpload {
    id: number;
    scheduleType: ScheduleType;
    originalFileName: string;
    storedFileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    groupName: string | null;
    facultyName: string | null;
    parseStatus: ScheduleParseStatus;
    parseErrors: string[] | null;
    parseWarnings: string[] | null;
    lessonsCount: number;
    periodStart: string | null;
    periodEnd: string | null;
    uploadedById: number;
    uploadedBy: User;
    parsedLessons: ParsedScheduleLesson[];
    uploadedAt: Date;
}
