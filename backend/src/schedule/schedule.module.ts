import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

import { Schedule } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { ScheduleUpload } from './entities/schedule-upload.entity';
import { ParsedScheduleLesson } from './entities/parsed-schedule-lesson.entity';
import { Room } from './entities/room.entity';
import { LessonType } from './entities/lesson-type.entity';
import { EducationDepartmentGuard } from './guards/education-department.guard';
import { ScheduleDisplayController } from './schedule-display.controller';
import { ScheduleDisplayService } from './schedule-display.service';
import { ScheduleUploadController } from './schedule-upload.controller';
import { ScheduleUploadService } from './schedule-upload.service';

@Module({
    imports: [
        AuthModule,
        UsersModule,
        TypeOrmModule.forFeature([
            Schedule,
            ScheduleItem,
            ScheduleUpload,
            ParsedScheduleLesson,
            Room,
            LessonType,
        ]),
    ],
    controllers: [ScheduleUploadController, ScheduleDisplayController],
    providers: [ScheduleUploadService, ScheduleDisplayService, EducationDepartmentGuard],
    exports: [TypeOrmModule],
})
export class ScheduleModule {}