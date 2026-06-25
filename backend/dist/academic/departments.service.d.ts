import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
export interface TeacherDepartmentInfo {
    id: number;
    shortName: string;
    name: string;
    label: string;
}
export declare class DepartmentsService {
    private readonly departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    private mapDepartment;
    listTeacherDepartments(): Promise<TeacherDepartmentInfo[]>;
    resolveTeacherDepartmentId(departmentId: number): Promise<Department>;
    getTeacherDepartmentById(departmentId: number): Promise<TeacherDepartmentInfo>;
    getTeacherDepartmentByShortName(shortName: string): Promise<Department>;
}
