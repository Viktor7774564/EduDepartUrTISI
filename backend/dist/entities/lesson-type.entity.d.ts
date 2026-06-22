import { ScheduleItem } from './schedule-item.entity';
export declare enum LessonTypeCode {
    LECTURE = "lecture",
    PRACTICE = "practice",
    LAB = "lab",
    CREDIT = "credit"
}
export declare class LessonType {
    id: number;
    code: LessonTypeCode;
    name: string;
    scheduleItems: ScheduleItem[];
}
