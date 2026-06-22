import { Direction } from './direction.entity';
import { Subgroup } from './subgroup.entity';
import { StudentProfile } from './student-profile.entity';
import { Schedule } from './schedule.entity';
export declare enum EducationForm {
    FULL_TIME = "full_time",
    PART_TIME = "part_time",
    DISTANCE = "distance"
}
export declare class Group {
    id: number;
    name: string;
    directionId: number;
    direction: Direction;
    course: number;
    educationForm: EducationForm;
    subgroups: Subgroup[];
    studentProfiles: StudentProfile[];
    schedules: Schedule[];
}
