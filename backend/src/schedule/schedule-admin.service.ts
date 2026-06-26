import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Group, EducationForm } from '../academic/entities/group.entity';
import { Direction } from '../academic/entities/direction.entity';
import { Subject } from '../academic/entities/subject.entity';
import { Subgroup } from '../academic/entities/subgroup.entity';

import { CreateScheduleItemDto, UpdateScheduleItemDto } from './dto/schedule-item.dto';
import { Schedule } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { ScheduleDisplayLesson } from './schedule-display.service';
import {
    formatRoomLabel,
    mapItemToDisplayLesson,
    mapItemToLessonSlot,
    resolveTeacherName,
} from './schedule-item.mapper';
import { normalizeWeekStart } from './parser/schedule-slot.utils';
import { validateScheduleConflicts } from './parser/schedule-conflict.validator';
import { LessonTypeResolver } from './resolver/lesson-type.resolver';
import { RoomResolver } from './resolver/room.resolver';
import { TeacherResolver } from './resolver/teacher.resolver';

const ITEM_RELATIONS = [
    'schedule',
    'schedule.group',
    'subject',
    'subgroup',
    'lessonType',
    'teacher',
    'room',
] as const;

@Injectable()
export class ScheduleAdminService {
    private static readonly IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';

    constructor(
        @InjectRepository(ScheduleItem)
        private readonly itemsRepository: Repository<ScheduleItem>,
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
        @InjectRepository(Group)
        private readonly groupsRepository: Repository<Group>,
        @InjectRepository(Direction)
        private readonly directionsRepository: Repository<Direction>,
        @InjectRepository(Subject)
        private readonly subjectsRepository: Repository<Subject>,
        @InjectRepository(Subgroup)
        private readonly subgroupsRepository: Repository<Subgroup>,
        private readonly roomResolver: RoomResolver,
        private readonly teacherResolver: TeacherResolver,
        private readonly lessonTypeResolver: LessonTypeResolver,
    ) {}

    private toDate(value: string): string {
        const trimmed = value.trim();

        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return trimmed.slice(0, 10);
        }

        const [day, month, year] = trimmed.split('.');
        const pad = (part: string) => part.padStart(2, '0');

        return `${year}-${pad(month)}-${pad(day)}`;
    }

    private async findOrCreateImportDirection(): Promise<Direction> {
        let direction = await this.directionsRepository.findOne({
            where: { code: ScheduleAdminService.IMPORT_DIRECTION_CODE },
        });

        if (!direction) {
            direction = await this.directionsRepository.save(
                this.directionsRepository.create({
                    code: ScheduleAdminService.IMPORT_DIRECTION_CODE,
                    name: 'Импорт расписания',
                }),
            );
        }

        return direction;
    }

    private async findOrCreateGroup(groupName: string): Promise<Group> {
        const trimmed = groupName.trim();

        const existing = await this.groupsRepository
            .createQueryBuilder('group')
            .where('UPPER(TRIM(group.name)) = UPPER(:name)', { name: trimmed })
            .getOne();

        if (existing) {
            return existing;
        }

        const direction = await this.findOrCreateImportDirection();

        return this.groupsRepository.save(
            this.groupsRepository.create({
                name: trimmed,
                directionId: direction.id,
                course: 1,
                educationForm: EducationForm.FULL_TIME,
            }),
        );
    }

    private async findOrCreateSubject(name: string): Promise<Subject> {
        const trimmed = name.trim();

        let subject = await this.subjectsRepository.findOne({
            where: { name: trimmed },
        });

        if (!subject) {
            subject = await this.subjectsRepository.save(
                this.subjectsRepository.create({
                    name: trimmed,
                    description: null,
                }),
            );
        }

        return subject;
    }

    private async findSubgroup(
        groupId: number,
        number: number | null | undefined,
    ): Promise<Subgroup | null> {
        if (!number) {
            return null;
        }

        const subgroupNumber = number as 1 | 2;

        const existing = await this.subgroupsRepository.findOne({
            where: {
                groupId,
                number: subgroupNumber,
            },
        });

        if (existing) {
            return existing;
        }

        return this.subgroupsRepository.save(
            this.subgroupsRepository.create({
                groupId,
                number: subgroupNumber,
            }),
        );
    }

    private async findScheduleForWeek(
        groupName: string,
        weekStart: string,
    ): Promise<Schedule> {
        const weekStartIso = this.toDate(weekStart);
        const normalizedGroupName = groupName.trim();

        const scheduleInPeriod = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.group', 'group')
            .where('UPPER(TRIM(group.name)) = UPPER(:groupName)', {
                groupName: normalizedGroupName,
            })
            .andWhere('schedule.isActive = true')
            .andWhere('schedule.validFrom <= :weekStart', { weekStart: weekStartIso })
            .andWhere('schedule.validTo >= :weekStart', { weekStart: weekStartIso })
            .orderBy('schedule.validFrom', 'DESC')
            .getOne();

        if (scheduleInPeriod) {
            return scheduleInPeriod;
        }

        const scheduleByExistingWeek = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.group', 'group')
            .innerJoin('schedule.items', 'item')
            .where('UPPER(TRIM(group.name)) = UPPER(:groupName)', {
                groupName: normalizedGroupName,
            })
            .andWhere('schedule.isActive = true')
            .andWhere('item.isDisabled = false')
            .andWhere('item.weekStart = :weekStart', { weekStart: weekStartIso })
            .orderBy('schedule.validFrom', 'DESC')
            .getOne();

        if (scheduleByExistingWeek) {
            return scheduleByExistingWeek;
        }

        const activeSchedule = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.group', 'group')
            .where('UPPER(TRIM(group.name)) = UPPER(:groupName)', {
                groupName: normalizedGroupName,
            })
            .andWhere('schedule.isActive = true')
            .orderBy('schedule.validFrom', 'DESC')
            .getOne();

        if (activeSchedule) {
            return activeSchedule;
        }

        throw new BadRequestException(
            'Расписание для этой группы и недели не найдено. Загрузите файл расписания.',
        );
    }

    private async loadItemWithRelations(id: number): Promise<ScheduleItem> {
        const item = await this.itemsRepository.findOne({
            where: { id },
            relations: [...ITEM_RELATIONS],
        });

        if (!item) {
            throw new NotFoundException('Занятие не найдено');
        }

        return item;
    }

    private async applySlotFields(
        item: ScheduleItem,
        slot: {
            subject: string;
            lessonType: string;
            teacherName?: string;
            room?: string;
            subgroup?: number | null;
            dayOfWeek?: number;
            startTime?: string;
            endTime?: string;
            weekStart?: string;
            comment?: string | null;
        },
        groupId: number,
    ): Promise<void> {
        const subject = await this.findOrCreateSubject(slot.subject);
        const lessonType = await this.lessonTypeResolver.resolve(slot.lessonType);
        const room = slot.room?.trim()
            ? await this.roomResolver.resolve(slot.room)
            : null;

        const teacher = slot.teacherName?.trim()
            ? await this.teacherResolver.resolve(slot.teacherName)
            : null;

        const subgroup = await this.findSubgroup(groupId, slot.subgroup ?? null);

        item.subject = subject;
        item.lessonType = lessonType;
        item.room = room;
        item.teacher = teacher;
        item.subgroup = subgroup;
        item.subjectId = subject.id;
        item.lessonTypeId = lessonType.id;
        item.roomId = room?.id ?? null;
        item.teacherId = teacher?.id ?? null;
        item.subgroupId = subgroup?.id ?? null;
        item.legacyTeacherName = teacher ? null : (slot.teacherName?.trim() || null);

        if (slot.dayOfWeek !== undefined) {
            item.dayOfWeek = slot.dayOfWeek;
        }

        if (slot.startTime !== undefined) {
            item.startTime = slot.startTime;
        }

        if (slot.endTime !== undefined) {
            item.endTime = slot.endTime;
        }

        if (slot.weekStart !== undefined) {
            item.weekStart = this.toDate(slot.weekStart);
        }

        if (slot.comment !== undefined) {
            item.comment = slot.comment;
        }
    }

    private async loadActiveLessonSlots(excludeItemId?: number) {
        const query = this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .leftJoinAndSelect('item.subject', 'subject')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .leftJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .where('item.isDisabled = false');

        if (excludeItemId) {
            query.andWhere('item.id != :excludeItemId', { excludeItemId });
        }

        const items = await query.getMany();

        return items.map((entry) => mapItemToLessonSlot(entry));
    }

    private async assertNoConflicts(
        candidate: ScheduleItem,
        excludeItemId?: number,
    ): Promise<void> {
        const existingLessons = await this.loadActiveLessonSlots(excludeItemId);
        const candidateSlot = mapItemToLessonSlot(candidate);
        const conflicts = validateScheduleConflicts([candidateSlot], existingLessons);

        if (conflicts.length === 0) {
            return;
        }

        throw new BadRequestException({
            message: 'Невозможно сохранить: обнаружен конфликт в расписании',
            errors: conflicts.map((conflict) => conflict.message),
        });
    }

    async createItem(dto: CreateScheduleItemDto): Promise<ScheduleDisplayLesson> {
        const group = await this.findOrCreateGroup(dto.groupName);
        const schedule = await this.findScheduleForWeek(dto.groupName, dto.weekStart);

        const item = this.itemsRepository.create({
            scheduleId: schedule.id,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            weekStart: this.toDate(dto.weekStart),
            isDisabled: false,
            isSameCellParallel: false,
            teacherPosition: null,
            weekType: null,
            comment: dto.comment?.trim() || null,
        });

        await this.applySlotFields(item, dto, group.id);
        item.schedule = schedule;
        item.schedule.group = group;

        await this.assertNoConflicts(item);

        const saved = await this.itemsRepository.save(item);

        return mapItemToDisplayLesson(await this.loadItemWithRelations(saved.id));
    }

    async updateItem(
        id: number,
        dto: UpdateScheduleItemDto,
    ): Promise<ScheduleDisplayLesson> {
        const item = await this.loadItemWithRelations(id);
        const groupName = item.schedule.group?.name;

        if (!groupName) {
            throw new BadRequestException('У занятия не указана группа');
        }

        await this.applySlotFields(item, {
            subject: dto.subject?.trim() ?? item.subject.name,
            lessonType: dto.lessonType?.trim() ?? item.lessonType.name,
            teacherName: dto.teacherName !== undefined
                ? dto.teacherName.trim()
                : resolveTeacherName(item),
            room: dto.room !== undefined
                ? dto.room.trim()
                : formatRoomLabel(item.room),
            subgroup: dto.subgroup !== undefined
                ? dto.subgroup
                : (item.subgroup?.number ?? null),
            dayOfWeek: dto.dayOfWeek ?? item.dayOfWeek,
            startTime: dto.startTime ?? item.startTime,
            endTime: dto.endTime ?? item.endTime,
            weekStart: dto.weekStart ?? normalizeWeekStart(String(item.weekStart)),
            comment: dto.comment !== undefined
                ? (dto.comment?.trim() || null)
                : undefined,
        }, item.schedule.groupId!);

        await this.assertNoConflicts(item, id);

        await this.itemsRepository.save(item);

        return mapItemToDisplayLesson(await this.loadItemWithRelations(id));
    }

    async disableItem(id: number): Promise<void> {
        const item = await this.itemsRepository.findOne({ where: { id } });

        if (!item) {
            throw new NotFoundException('Занятие не найдено');
        }

        item.isDisabled = true;
        await this.itemsRepository.save(item);
    }

    async deleteItem(id: number): Promise<void> {
        const item = await this.itemsRepository.findOne({ where: { id } });

        if (!item) {
            throw new NotFoundException('Занятие не найдено');
        }

        await this.itemsRepository.delete(id);
    }
}
