import { IsInt, IsOptional, Min } from 'class-validator';

export class SetDepartmentHeadDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    headUserId?: number | null;
}
