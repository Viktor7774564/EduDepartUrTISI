import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
export declare class SeedService {
    private readonly authService;
    private readonly usersService;
    private readonly dataSource;
    constructor(authService: AuthService, usersService: UsersService, dataSource: DataSource);
    run(): Promise<void>;
}
