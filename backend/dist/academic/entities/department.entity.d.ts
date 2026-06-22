import { TeacherProfile } from '../../users/entities/teacher-profile.entity';
import { StaffProfile } from '../../users/entities/staff-profile.entity';
export declare class Department {
    id: number;
    name: string;
    shortName: string | null;
    teacherProfiles: TeacherProfile[];
    staffProfiles: StaffProfile[];
}
