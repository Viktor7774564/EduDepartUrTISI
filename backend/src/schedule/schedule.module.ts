import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Schedule } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { Room } from './entities/room.entity';
import { LessonType } from './entities/lesson-type.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Schedule,
            ScheduleItem,
            Room,
            LessonType,
        ]),
    ],
    exports: [TypeOrmModule],
})
export class ScheduleModule {}