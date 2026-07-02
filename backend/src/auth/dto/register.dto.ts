import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty({ message: 'Логин не может быть пустым' })
    login!: string;

    @IsString()
    @MinLength(8, { message: 'Пароль должен быть не менее 8 символов' })
    password!: string;
}
