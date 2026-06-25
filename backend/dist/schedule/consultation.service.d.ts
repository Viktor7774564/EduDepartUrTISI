import { Repository } from 'typeorm';
import { DepartmentsService } from '../academic/departments.service';
import { User } from '../users/entities/user.entity';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';
import { Consultation } from './entities/consultation.entity';
import { ScheduleDisplayLesson } from './schedule-display.service';
export interface DepartmentInfo {
    id: number;
    shortName: string;
    name: string;
    label: string;
}
export interface DepartmentConsultationsResponse {
    departmentId: number;
    departmentName: string;
    departmentLabel: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
}
export declare class ConsultationService {
    private readonly consultationsRepository;
    private readonly departmentsService;
    constructor(consultationsRepository: Repository<Consultation>, departmentsService: DepartmentsService);
    formatTeacherName(user: User): string;
    private parseWeekStart;
    private formatWeekLabel;
    private formatTime;
    private mapConsultation;
    listDepartments(): Promise<DepartmentInfo[]>;
    getDepartmentConsultations(departmentId: number): Promise<DepartmentConsultationsResponse>;
    private assertTeacherInDepartment;
    createConsultation(user: User, dto: CreateConsultationDto): Promise<ScheduleDisplayLesson>;
    updateConsultation(user: User, id: number, dto: UpdateConsultationDto): Promise<ScheduleDisplayLesson>;
    deleteConsultation(user: User, id: number): Promise<void>;
}
