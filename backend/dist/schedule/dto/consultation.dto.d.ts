export declare class CreateConsultationDto {
    departmentId: number;
    subject: string;
    consultationType: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    weekStart: string;
    room?: string;
}
export declare class UpdateConsultationDto {
    subject?: string;
    consultationType?: string;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    weekStart?: string;
    room?: string;
}
