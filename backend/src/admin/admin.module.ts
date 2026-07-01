import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from '../users/users.module';
import { AcademicModule } from '../academic/academic.module';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UploadsModule } from '../uploads/uploads.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { RolesSeedService } from './roles-seed.service';

import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { ConsultationNotificationPreference } from '../notifications/consultation-notification-preference.entity';
import { Consultation } from '../schedule/entities/consultation.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { ScheduleItem } from '../schedule/entities/schedule-item.entity';
import { ScheduleUpload } from '../schedule/entities/schedule-upload.entity';
import { Role } from '../users/entities/role.entity';
import { StudentProfile } from '../users/entities/student-profile.entity';
import { TeacherProfile } from '../users/entities/teacher-profile.entity';
import { StaffProfile } from '../users/entities/staff-profile.entity';

@Module({
    imports: [
        UsersModule,
        AcademicModule,
        AuthModule,
        SessionsModule,
        UploadsModule,
        TypeOrmModule.forFeature([
            RefreshToken,
            Role,
            StudentProfile,
            TeacherProfile,
            StaffProfile,
            Consultation,
            ScheduleItem,
            Schedule,
            ScheduleUpload,
            ConsultationNotificationPreference,
        ]),
    ],
    controllers: [AdminController],
    providers: [AdminService, AdminGuard, RolesSeedService],
})
export class AdminModule {}
