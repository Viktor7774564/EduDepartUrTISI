import { TeacherProfile } from './teacher-profile.entity';
import { StaffProfile } from './staff-profile.entity';
export declare class Department {
    id: number;
    name: string;
    shortName: string | null;
    teacherProfiles: TeacherProfile[];
    staffProfiles: StaffProfile[];
}
