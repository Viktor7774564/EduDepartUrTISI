import { User } from './user.entity';
import { Department } from './department.entity';
export declare class TeacherProfile {
    id: number;
    userId: number;
    user: User;
    departmentId: number;
    department: Department;
    position: string;
    cabinet: string | null;
}
