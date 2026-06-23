import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        login: string;
        refreshToken?: string;
    };
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    refresh(req: AuthenticatedRequest): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(req: AuthenticatedRequest): Promise<{
        success: boolean;
    }>;
}
export {};
