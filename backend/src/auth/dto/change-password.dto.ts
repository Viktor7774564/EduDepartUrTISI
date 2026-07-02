import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Введите текущий пароль' })
    currentPassword!: string;

    @IsString()
    @MinLength(3, { message: 'Новый пароль должен быть не менее 3 символов' })
    newPassword!: string;

    @IsOptional()
    @IsBoolean()
    logoutAllDevices?: boolean;
}