import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    ValidateIf,
} from 'class-validator';

export class UpdateConsultationNotificationPreferenceDto {
    @IsBoolean()
    enabled!: boolean;

    @IsBoolean()
    allTeachers!: boolean;

    @ValidateIf((dto: UpdateConsultationNotificationPreferenceDto) =>
        dto.enabled && !dto.allTeachers)
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    teacherIds?: number[];
}

export type ConsultationNotificationPreferenceResponse = {
    enabled: boolean;
    allTeachers: boolean;
    teacherIds: number[];
};

export type ConsultationTeacherOption = {
    id: number;
    name: string;
    departmentId: number;
    departmentLabel: string;
};