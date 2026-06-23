import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { StaffProfile } from './entities/staff-profile.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Role,
            StudentProfile,
            TeacherProfile,
            StaffProfile,
        ]),
    ],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}