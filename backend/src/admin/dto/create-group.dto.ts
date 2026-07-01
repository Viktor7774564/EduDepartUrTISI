import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { EducationForm } from '../../academic/entities/group.entity';

export class CreateGroupDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsEnum(EducationForm)
    educationForm!: EducationForm;
}
