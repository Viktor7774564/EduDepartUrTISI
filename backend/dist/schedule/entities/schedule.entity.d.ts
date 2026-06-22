import { Group } from '../../academic/entities/group.entity';
import { User } from '../../users/entities/user.entity';
import { ScheduleItem } from './schedule-item.entity';
export declare enum ScheduleType {
    STUDENT = "student",
    TEACHER = "teacher",
    AUDITORY = "auditory",
    CONSULTATION = "consultation"
}
export declare class Schedule {
    id: number;
    scheduleType: ScheduleType;
    groupId: number | null;
    group: Group | null;
    teacherId: number | null;
    teacher: User | null;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    items: ScheduleItem[];
}
