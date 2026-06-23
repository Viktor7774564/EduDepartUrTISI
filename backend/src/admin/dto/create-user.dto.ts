import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    Min,
    MinLength,
} from 'class-validator';

import { RoleCode } from '../../users/entities/role.entity';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    login!: string;

    @IsString()
    @MinLength(3)
    password!: string;

    @IsEnum(RoleCode)
    role!: RoleCode;

    @IsString()
    @IsNotEmpty()
    surname!: string;

    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    patronymic?: string;

    @IsString()
    @IsOptional()
    group?: string;

    @IsString()
    @IsOptional()
    direction?: string;

    @IsString()
    @IsOptional()
    educationForm?: string;

    @IsInt()
    @Min(1)
    @Max(6)
    @IsOptional()
    course?: number;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    position?: string;

    @IsString()
    @IsOptional()
    cabinet?: string;
}
