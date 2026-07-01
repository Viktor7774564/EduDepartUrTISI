import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTeacherDepartmentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    shortName!: string;
}
