import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateStaffDepartmentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name!: string;
}
