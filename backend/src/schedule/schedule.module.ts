import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Group } from '../academic/entities/group.entity';
import { Direction } from '../academic/entities/direction.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';
import { AcademicModule } from '../academic/academic.module';
import { AuthModule } from '../auth/auth.module';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { Consultation } from './entities/consultation.entity';
import { Schedule } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { ScheduleUpload } from './entities/schedule-upload.entity';
import { ParsedScheduleLesson } from './entities/parsed-schedule-lesson.entity';
import { SchedulePreholidayDay } from './entities/schedule-preholiday-day.entity';
import { Room } from './entities/room.entity';
import { LessonType } from './entities/lesson-type.entity';
import { EducationDepartmentGuard } from './guards/education-department.guard';
import { TeacherGuard } from './guards/teacher.guard';
import {
    SchedulePreholidayAdminController,
    SchedulePreholidayDisplayController,
} from './schedule-preholiday.controller';
import { ScheduleAdminController } from './schedule-admin.controller';
import { ScheduleAdminService } from './schedule-admin.service';
import { ScheduleDisplayController } from './schedule-display.controller';
import { ScheduleDisplayService } from './schedule-display.service';
import { ScheduleUploadController } from './schedule-upload.controller';
import { ScheduleImportService } from './schedule-import.service';
import { SchedulePreholidayService } from './schedule-preholiday.service';
import { ScheduleUploadService } from './schedule-upload.service';
import { LessonTypeResolver } from './resolver/lesson-type.resolver';
import { RoomResolver } from './resolver/room.resolver';
import { TeacherResolver } from './resolver/teacher.resolver';
import { ScheduleGateway } from './schedule.gateway'
import { ScheduleNotifierService } from './schedule-notifier.service'

@Module({
    imports: [
        AcademicModule,
        AuthModule,
        UsersModule,
        TypeOrmModule.forFeature([
            Schedule,
            ScheduleItem,
            ScheduleUpload,
            ParsedScheduleLesson,
            SchedulePreholidayDay,
            Room,
            LessonType,
            Consultation,
            Group,
            Direction,
            Subject,
            Subgroup,
            User,
            Role,
        ]),
    ],
    controllers: [
        ScheduleUploadController,
        ScheduleAdminController,
        ScheduleDisplayController,
        SchedulePreholidayDisplayController,
        SchedulePreholidayAdminController,
        ConsultationController,
    ],
    providers: [
        ScheduleUploadService,
        ScheduleImportService,
        SchedulePreholidayService,
        ScheduleAdminService,
        ScheduleDisplayService,
        ConsultationService,
        RoomResolver,
        TeacherResolver,
        LessonTypeResolver,
        EducationDepartmentGuard,
        TeacherGuard,
        ScheduleGateway,
        ScheduleNotifierService,
    ],
    exports: [TypeOrmModule],
})
export class ScheduleModule {}