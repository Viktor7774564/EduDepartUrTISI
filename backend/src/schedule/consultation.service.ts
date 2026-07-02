import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DepartmentsService } from '../academic/departments.service';
import { ConsultationNotificationsService } from '../notifications/consultation-notifications.service';
import { User } from '../users/entities/user.entity';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/consultation.dto';
import { Consultation } from './entities/consultation.entity';
import { TeacherResolver } from './resolver/teacher.resolver';
import { ScheduleDisplayLesson } from './schedule-display.service';
import { normalizeWeekStart } from './parser/schedule-slot.utils';

const DAY_LABELS: Record<number, string> = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};

export interface DepartmentInfo {
    id: number;
    shortName: string;
    name: string;
    label: string;
}

export interface DepartmentConsultationsResponse {
    departmentId: number;
    departmentName: string;
    departmentLabel: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
}

@Injectable()
export class ConsultationService {
    constructor(
        @InjectRepository(Consultation)
        private readonly consultationsRepository: Repository<Consultation>,
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly departmentsService: DepartmentsService,
        private readonly teacherResolver: TeacherResolver,
        private readonly consultationNotificationsService: ConsultationNotificationsService,
    ) {}

    formatTeacherName(user: User): string {
        const nameInitial = user.name?.charAt(0) ?? '';
        const patronymicInitial = user.patronymic?.charAt(0) ?? '';

        return `${user.surname} ${nameInitial}.${patronymicInitial}.`.trim();
    }

    private parseWeekStart(value: string): Date {
        const dottedMatch = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dottedMatch) {
            return new Date(
                Number(dottedMatch[3]),
                Number(dottedMatch[2]) - 1,
                Number(dottedMatch[1]),
            );
        }

        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    private formatWeekLabel(weekStart: string): string {
        const start = this.parseWeekStart(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const pad = (part: number) => String(part).padStart(2, '0');

        return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}`;
    }

    private formatTime(value: string): string {
        return value.slice(0, 5);
    }

    private mapConsultation(consultation: Consultation): ScheduleDisplayLesson {
        return {
            id: consultation.id,
            day: DAY_LABELS[consultation.dayOfWeek] ?? '',
            startTime: this.formatTime(consultation.startTime),
            endTime: this.formatTime(consultation.endTime),
            subject: consultation.subject,
            teacher: this.formatTeacherName(consultation.teacher),
            type: consultation.consultationType,
            room: consultation.room?.trim() ?? '',
            group: '',
            linkedGroups: [],
            subgroup: null,
            isSameCellParallel: false,
            comment: consultation.comment,
            weekStart: normalizeWeekStart(String(consultation.weekStart)),
        };
    }

    async listDepartments(): Promise<DepartmentInfo[]> {
        return this.departmentsService.listTeacherDepartments();
    }

    async getDepartmentConsultations(departmentId: number): Promise<DepartmentConsultationsResponse> {
        const department = await this.departmentsService.getTeacherDepartmentById(departmentId);

        const consultations = await this.consultationsRepository.find({
            where: { departmentId },
            relations: ['teacher'],
            order: {
                weekStart: 'ASC',
                dayOfWeek: 'ASC',
                startTime: 'ASC',
            },
        });

        const weeks = new Map<string, ScheduleDisplayLesson[]>();
        const weekOrder: string[] = [];

        for (const consultation of consultations) {
            const weekLabel = this.formatWeekLabel(String(consultation.weekStart));

            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }

            weeks.get(weekLabel)?.push(this.mapConsultation(consultation));
        }

        const orderedWeeks: Record<string, ScheduleDisplayLesson[]> = {};
        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }

        return {
            departmentId: department.id,
            departmentName: department.name,
            departmentLabel: department.label,
            weeks: orderedWeeks,
        };
    }

    private resolveUserDepartmentId(user: User): number | null {
        return user.teacherProfile?.departmentId
            ?? user.staffProfile?.departmentId
            ?? null;
    }

    private assertUserInDepartment(user: User, departmentId: number): void {
        const userDepartmentId = this.resolveUserDepartmentId(user);

        if (!userDepartmentId || userDepartmentId !== departmentId) {
            throw new ForbiddenException(
                'Можно управлять консультациями только своей кафедры',
            );
        }
    }

    private async resolveDepartmentTeacher(
        departmentId: number,
        teacherName: string,
    ): Promise<User> {
        const trimmedName = teacherName.trim();

        if (!trimmedName) {
            throw new BadRequestException('Укажите преподавателя');
        }

        const resolvedTeacher = await this.teacherResolver.resolve(trimmedName);

        if (!resolvedTeacher) {
            throw new BadRequestException('Преподаватель не найден');
        }

        const teacher = await this.usersRepository.findOne({
            where: { id: resolvedTeacher.id },
            relations: ['teacherProfile'],
        });

        if (!teacher?.teacherProfile?.departmentId) {
            throw new BadRequestException('У выбранного пользователя нет профиля преподавателя');
        }

        if (teacher.teacherProfile.departmentId !== departmentId) {
            throw new BadRequestException('Преподаватель не относится к выбранной кафедре');
        }

        return teacher;
    }

    async createConsultation(user: User, dto: CreateConsultationDto): Promise<ScheduleDisplayLesson> {
        this.assertUserInDepartment(user, dto.departmentId);
        await this.departmentsService.getTeacherDepartmentById(dto.departmentId);

        const teacher = await this.resolveDepartmentTeacher(dto.departmentId, dto.teacherName);

        const consultation = this.consultationsRepository.create({
            departmentId: dto.departmentId,
            teacherId: teacher.id,
            subject: dto.subject.trim(),
            consultationType: dto.consultationType,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            weekStart: dto.weekStart,
            room: dto.room?.trim() || null,
            comment: dto.comment?.trim() || null,
        });

        const saved = await this.consultationsRepository.save(consultation);
        const withTeacher = await this.consultationsRepository.findOne({
            where: { id: saved.id },
            relations: ['teacher'],
        });

        if (!withTeacher) {
            throw new NotFoundException('Консультация не найдена');
        }

        await this.consultationNotificationsService.notifyConsultationChanged('created', withTeacher);

        return this.mapConsultation(withTeacher);
    }

    async updateConsultation(
        user: User,
        id: number,
        dto: UpdateConsultationDto,
    ): Promise<ScheduleDisplayLesson> {
        const consultation = await this.consultationsRepository.findOne({
            where: { id },
            relations: ['teacher'],
        });

        if (!consultation) {
            throw new NotFoundException('Консультация не найдена');
        }

        const previousSnapshot = this.consultationNotificationsService
            .createConsultationSnapshot(consultation);

        this.assertUserInDepartment(user, consultation.departmentId);

        if (dto.subject !== undefined) {
            consultation.subject = dto.subject.trim();
        }

        if (dto.teacherName !== undefined) {
            const teacher = await this.resolveDepartmentTeacher(
                consultation.departmentId,
                dto.teacherName,
            );
            consultation.teacherId = teacher.id;
        }

        if (dto.consultationType !== undefined) {
            consultation.consultationType = dto.consultationType;
        }

        if (dto.dayOfWeek !== undefined) {
            consultation.dayOfWeek = dto.dayOfWeek;
        }

        if (dto.startTime !== undefined) {
            consultation.startTime = dto.startTime;
        }

        if (dto.endTime !== undefined) {
            consultation.endTime = dto.endTime;
        }

        if (dto.weekStart !== undefined) {
            consultation.weekStart = dto.weekStart;
        }

        if (dto.room !== undefined) {
            consultation.room = dto.room.trim() || null;
        }

        if (dto.comment !== undefined) {
            consultation.comment = dto.comment.trim() || null;
        }

        const saved = await this.consultationsRepository.save(consultation);

        const withTeacher = await this.consultationsRepository.findOne({
            where: { id: saved.id },
            relations: ['teacher'],
        });

        if (!withTeacher) {
            throw new NotFoundException('Консультация не найдена');
        }

        await this.consultationNotificationsService.notifyConsultationChanged(
            'updated',
            withTeacher,
            previousSnapshot,
        );

        return this.mapConsultation(withTeacher);
    }

    async deleteConsultation(user: User, id: number): Promise<void> {
        const consultation = await this.consultationsRepository.findOne({
            where: { id },
            relations: ['teacher'],
        });

        if (!consultation) {
            throw new NotFoundException('Консультация не найдена');
        }

        this.assertUserInDepartment(user, consultation.departmentId);

        await this.consultationNotificationsService.notifyConsultationChanged('deleted', consultation);
        await this.consultationsRepository.delete(id);
    }
}
