import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { UsersService } from '../users/users.service';

import {
    ConsultationService,
    DepartmentConsultationsResponse,
    DepartmentInfo,
} from './consultation.service';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';
import { TeacherGuard } from './guards/teacher.guard';
import { ScheduleDisplayLesson } from './schedule-display.service';

@Controller('schedules/consultations')
export class ConsultationController {
    constructor(
        private readonly consultationService: ConsultationService,
        private readonly usersService: UsersService,
    ) {}

    @Get('departments')
    listDepartments(): Promise<DepartmentInfo[]> {
        return this.consultationService.listDepartments();
    }

    @Get('departments/:departmentId')
    getDepartmentConsultations(
        @Param('departmentId', ParseIntPipe) departmentId: number,
    ): Promise<DepartmentConsultationsResponse> {
        return this.consultationService.getDepartmentConsultations(departmentId);
    }

    @Post()
    @UseGuards(AccessTokenGuard, TeacherGuard)
    async createConsultation(
        @Req() request: Request & { user?: { sub?: number } },
        @Body() dto: CreateConsultationDto,
    ): Promise<ScheduleDisplayLesson> {
        const user = await this.usersService.findByIdWithDetails(request.user!.sub!);

        return this.consultationService.createConsultation(user, dto);
    }

    @Patch(':id')
    @UseGuards(AccessTokenGuard, TeacherGuard)
    async updateConsultation(
        @Req() request: Request & { user?: { sub?: number } },
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateConsultationDto,
    ): Promise<ScheduleDisplayLesson> {
        const user = await this.usersService.findByIdWithDetails(request.user!.sub!);

        return this.consultationService.updateConsultation(user, id, dto);
    }

    @Delete(':id')
    @UseGuards(AccessTokenGuard, TeacherGuard)
    async deleteConsultation(
        @Req() request: Request & { user?: { sub?: number } },
        @Param('id', ParseIntPipe) id: number,
    ): Promise<void> {
        const user = await this.usersService.findByIdWithDetails(request.user!.sub!);

        return this.consultationService.deleteConsultation(user, id);
    }
}
