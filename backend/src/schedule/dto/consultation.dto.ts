import {
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';

export class CreateConsultationDto {
    @IsInt()
    departmentId!: number;

    @IsString()
    @IsNotEmpty()
    subject!: string;

    @IsString()
    @IsIn(['Консультация', 'Онлайн-консультация'])
    consultationType!: string;

    @IsInt()
    @Min(1)
    @Max(7)
    dayOfWeek!: number;

    @IsString()
    @IsNotEmpty()
    startTime!: string;

    @IsString()
    @IsNotEmpty()
    endTime!: string;

    @IsString()
    @IsNotEmpty()
    weekStart!: string;

    @IsOptional()
    @IsString()
    room?: string;
}

export class UpdateConsultationDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    subject?: string;

    @IsOptional()
    @IsString()
    @IsIn(['Консультация', 'Онлайн-консультация'])
    consultationType?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(7)
    dayOfWeek?: number;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    startTime?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    endTime?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    weekStart?: string;

    @IsOptional()
    @IsString()
    room?: string;
}
