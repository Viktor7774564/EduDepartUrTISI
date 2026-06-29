import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UpdateSchedulePreholidayDayDto } from './dto/schedule-preholiday-day.dto';
import { EducationDepartmentGuard } from './guards/education-department.guard';
import { SchedulePreholidayService } from './schedule-preholiday.service';

@Controller('schedules/preholiday-days')
export class SchedulePreholidayDisplayController {
    constructor(
        private readonly schedulePreholidayService: SchedulePreholidayService,
    ) {}

    @Get()
    listPreholidayDays(): Promise<string[]> {
        return this.schedulePreholidayService.listPreholidayDays();
    }
}

@Controller('education-department/schedules/preholiday-days')
@UseGuards(AccessTokenGuard, EducationDepartmentGuard)
export class SchedulePreholidayAdminController {
    constructor(
        private readonly schedulePreholidayService: SchedulePreholidayService,
    ) {}

    @Patch()
    updatePreholidayDay(
        @Body() dto: UpdateSchedulePreholidayDayDto,
    ): Promise<string[]> {
        return this.schedulePreholidayService.updatePreholidayDay(dto);
    }
}
