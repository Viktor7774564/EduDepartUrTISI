import { Group } from './group.entity';
import { StudentProfile } from './student-profile.entity';
import { ScheduleItem } from './schedule-item.entity';
export declare class Subgroup {
    id: number;
    groupId: number;
    group: Group;
    number: 1 | 2;
    studentProfiles: StudentProfile[];
    scheduleItems: ScheduleItem[];
}
