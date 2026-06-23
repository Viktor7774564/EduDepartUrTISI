import { Request } from 'express';
import { AdminService } from './admin.service';
interface AuthenticatedRequest extends Request {
    user: {
        sub: number;
        login: string;
    };
}
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    listUsers(): Promise<import("./admin.service").AdminUserResponse[]>;
    createUser(body: Record<string, unknown>, photo?: Express.Multer.File): Promise<import("./admin.service").AdminUserResponse>;
    getUser(id: number): Promise<import("./admin.service").AdminUserResponse>;
    updateUser(id: number, body: Record<string, unknown>, photo: Express.Multer.File | undefined, req: AuthenticatedRequest): Promise<import("./admin.service").AdminUserResponse>;
    deleteUser(id: number, req: AuthenticatedRequest): Promise<{
        success: true;
    }>;
    listSessions(): Promise<import("./admin.service").AdminSessionResponse[]>;
    revokeSession(id: number): Promise<{
        success: true;
    }>;
}
export {};
