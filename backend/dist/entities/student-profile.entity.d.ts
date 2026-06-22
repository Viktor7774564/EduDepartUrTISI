import { User } from './user.entity';
import { Group, EducationForm } from './group.entity';
import { Subgroup } from './subgroup.entity';
export declare class StudentProfile {
    id: number;
    userId: number;
    user: User;
    groupId: number;
    group: Group;
    subgroupId: number | null;
    subgroup: Subgroup | null;
    course: number;
    educationForm: EducationForm;
}
