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
    mapItemToDisplayLesson,
    mapItemToLessonSlot,
} from './schedule-item.mapper';
import { ScheduleLessonSlot, validateScheduleConflicts } from './parser/schedule-conflict.validator';
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

        const existing = await this.groupsRepository.findOne({
            where: { name: trimmed },
        });

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

        return this.subgroupsRepository.findOne({
            where: {
                groupId,
                number: number as 1 | 2,
            },
        });
    }

    private async findScheduleForWeek(
        groupName: string,
        weekStart: string,
    ): Promise<Schedule> {
        const weekStartIso = this.toDate(weekStart);

        const schedule = await this.schedulesRepository
            .createQueryBuilder('schedule')
            .innerJoin('schedule.group', 'group')
            .where('group.name = :groupName', { groupName: groupName.trim() })
            .andWhere('schedule.isActive = true')
            .andWhere('schedule.validFrom <= :weekStart', { weekStart: weekStartIso })
            .andWhere('schedule.validTo >= :weekStart', { weekStart: weekStartIso })
            .getOne();

        if (!schedule) {
            throw new BadRequestException(
                'Расписание для этой группы и недели не найдено. Загрузите файл расписания.',
            );
        }

        return schedule;
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

    private async loadExistingSlots(
        excludeItemId?: number,
    ): Promise<ScheduleLessonSlot[]> {
        const qb = this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .leftJoinAndSelect('item.subject', 'subject')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .leftJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .where('item.isDisabled = false')
            .andWhere('schedule.isActive = true');

        if (excludeItemId) {
            qb.andWhere('item.id <> :excludeItemId', { excludeItemId });
        }

        const items = await qb.getMany();

        return items.map((item) => mapItemToLessonSlot(item));
    }

    private buildSlotFromDto(
        dto: CreateScheduleItemDto,
        groupName: string,
    ): ScheduleLessonSlot {
        return {
            groupName,
            dayOfWeek: dto.dayOfWeek,
            startTime: dto.startTime,
            endTime: dto.endTime,
            weekStart: dto.weekStart,
            subgroup: dto.subgroup ?? null,
            isDistance: /дист/i.test(dto.room ?? ''),
            isSameCellParallel: false,
            subject: dto.subject.trim(),
            lessonType: dto.lessonType.trim(),
            teacherPosition: '',
            teacherName: dto.teacherName?.trim() ?? '',
            room: dto.room?.trim() || null,
        };
    }

    private async assertNoConflicts(
        slot: ScheduleLessonSlot,
        excludeItemId?: number,
    ): Promise<void> {
        const existing = await this.loadExistingSlots(excludeItemId);
        const conflicts = validateScheduleConflicts([slot], existing);

        if (conflicts.length > 0) {
            throw new BadRequestException({
                message: 'Изменение отменено: обнаружены конфликты в расписании',
                errors: conflicts.map((conflict) => conflict.message),
            });
        }
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

    async createItem(dto: CreateScheduleItemDto): Promise<ScheduleDisplayLesson> {
        const group = await this.findOrCreateGroup(dto.groupName);
        const schedule = await this.findScheduleForWeek(dto.groupName, dto.weekStart);
        const slot = this.buildSlotFromDto(dto, group.name);

        await this.assertNoConflicts(slot);

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

        const nextSlot: ScheduleLessonSlot = {
            ...mapItemToLessonSlot(item),
            subject: dto.subject?.trim() ?? item.subject.name,
            lessonType: dto.lessonType?.trim() ?? item.lessonType.name,
            teacherName: dto.teacherName !== undefined
                ? dto.teacherName.trim()
                : mapItemToLessonSlot(item).teacherName,
            room: dto.room !== undefined ? (dto.room.trim() || null) : mapItemToLessonSlot(item).room,
            subgroup: dto.subgroup !== undefined ? dto.subgroup : (item.subgroup?.number ?? null),
            dayOfWeek: dto.dayOfWeek ?? item.dayOfWeek,
            startTime: dto.startTime ?? item.startTime,
            endTime: dto.endTime ?? item.endTime,
            weekStart: dto.weekStart ?? mapItemToLessonSlot(item).weekStart,
        };

        await this.assertNoConflicts(nextSlot, id);

        await this.applySlotFields(item, {
            subject: nextSlot.subject,
            lessonType: nextSlot.lessonType,
            teacherName: nextSlot.teacherName,
            room: nextSlot.room ?? undefined,
            subgroup: nextSlot.subgroup,
            dayOfWeek: nextSlot.dayOfWeek,
            startTime: nextSlot.startTime,
            endTime: nextSlot.endTime,
            weekStart: nextSlot.weekStart,
            comment: dto.comment,
        }, item.schedule.groupId!);

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
