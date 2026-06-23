import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty({ message: 'Логин не может быть пустым' })
    login!: string;

    @IsString()
    @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
    password!: string;
}
