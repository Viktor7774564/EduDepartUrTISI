import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty({ message: 'Логин не может быть пустым' })
    login!: string;

    @IsString()
    @IsNotEmpty({ message: 'Пароль не может быть пустым' })
    password!: string;
}
