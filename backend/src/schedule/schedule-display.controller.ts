import { Controller, Get, Param, Query } from '@nestjs/common';

import {
    GroupScheduleResponse,
    RoomScheduleResponse,
    ScheduleDisplayService,
    ScheduleGroupInfo,
    TeacherScheduleResponse,
} from './schedule-display.service';

@Controller('schedules')
export class ScheduleDisplayController {
    constructor(
        private readonly scheduleDisplayService: ScheduleDisplayService,
    ) {}

    @Get('groups')
    listGroups(): Promise<ScheduleGroupInfo[]> {
        return this.scheduleDisplayService.listGroups();
    }

    @Get('groups/:groupName')
    getGroupSchedule(@Param('groupName') groupName: string): Promise<GroupScheduleResponse> {
        return this.scheduleDisplayService.getGroupSchedule(groupName);
    }

    @Get('teachers')
    listTeachers(): Promise<string[]> {
        return this.scheduleDisplayService.listTeachers();
    }

    @Get('teachers/:teacherName')
    getTeacherSchedule(@Param('teacherName') teacherName: string): Promise<TeacherScheduleResponse> {
        return this.scheduleDisplayService.getTeacherSchedule(teacherName);
    }

    @Get('buildings')
    listBuildings(): Promise<string[]> {
        return this.scheduleDisplayService.listBuildings();
    }

    @Get('rooms')
    listRooms(@Query('building') building?: string): Promise<string[]> {
        return this.scheduleDisplayService.listRooms(building);
    }

    @Get('rooms/:roomName')
    getRoomSchedule(@Param('roomName') roomName: string): Promise<RoomScheduleResponse> {
        return this.scheduleDisplayService.getRoomSchedule(roomName);
    }
}
