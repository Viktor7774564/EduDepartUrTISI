import {
    Body,
    Controller,
    Delete,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';

import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CreateScheduleItemDto, UpdateScheduleItemDto } from './dto/schedule-item.dto';
import { EducationDepartmentGuard } from './guards/education-department.guard';
import { ScheduleAdminService } from './schedule-admin.service';
import { ScheduleDisplayLesson } from './schedule-display.service';

@Controller('education-department/schedules/items')
@UseGuards(AccessTokenGuard, EducationDepartmentGuard)
export class ScheduleAdminController {
    constructor(
        private readonly scheduleAdminService: ScheduleAdminService,
    ) {}

    @Post()
    createItem(@Body() dto: CreateScheduleItemDto): Promise<ScheduleDisplayLesson> {
        return this.scheduleAdminService.createItem(dto);
    }

    @Patch(':id')
    updateItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateScheduleItemDto,
    ): Promise<ScheduleDisplayLesson> {
        return this.scheduleAdminService.updateItem(id, dto);
    }

    @Patch(':id/disable')
    disableItem(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.scheduleAdminService.disableItem(id);
    }

    @Delete(':id')
    deleteItem(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.scheduleAdminService.deleteItem(id);
    }
}
