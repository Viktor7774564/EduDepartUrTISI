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
        user: import("./auth-user.mapper").AuthUserResponse;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth-user.mapper").AuthUserResponse;
    }>;
    me(req: AuthenticatedRequest): Promise<import("./auth-user.mapper").AuthUserResponse>;
    refresh(req: AuthenticatedRequest): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("./auth-user.mapper").AuthUserResponse;
    }>;
    logout(req: AuthenticatedRequest): Promise<{
        success: boolean;
    }>;
}
export {};
