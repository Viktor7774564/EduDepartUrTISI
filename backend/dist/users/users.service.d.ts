import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: Repository<User>);
    create(data: Partial<User>): Promise<User>;
    findById(id: number): Promise<User>;
    findByLogin(login: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    remove(id: number): Promise<void>;
}
