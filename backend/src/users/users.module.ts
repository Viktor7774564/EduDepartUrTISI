import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { StaffProfile } from './entities/staff-profile.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            Role,
            RefreshToken,
            StudentProfile,
            TeacherProfile,
            StaffProfile,
        ]),
    ],
    exports: [TypeOrmModule],
})
export class UsersModule {}