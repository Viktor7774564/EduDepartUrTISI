"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScheduleAdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleAdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const group_entity_1 = require("../academic/entities/group.entity");
const direction_entity_1 = require("../academic/entities/direction.entity");
const subject_entity_1 = require("../academic/entities/subject.entity");
const subgroup_entity_1 = require("../academic/entities/subgroup.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const schedule_item_mapper_1 = require("./schedule-item.mapper");
const schedule_conflict_validator_1 = require("./parser/schedule-conflict.validator");
const lesson_type_resolver_1 = require("./resolver/lesson-type.resolver");
const room_resolver_1 = require("./resolver/room.resolver");
const teacher_resolver_1 = require("./resolver/teacher.resolver");
const ITEM_RELATIONS = [
    'schedule',
    'schedule.group',
    'subject',
    'subgroup',
    'lessonType',
    'teacher',
    'room',
];
let ScheduleAdminService = class ScheduleAdminService {
    static { ScheduleAdminService_1 = this; }
    itemsRepository;
    schedulesRepository;
    groupsRepository;
    directionsRepository;
    subjectsRepository;
    subgroupsRepository;
    roomResolver;
    teacherResolver;
    lessonTypeResolver;
    static IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';
    constructor(itemsRepository, schedulesRepository, groupsRepository, directionsRepository, subjectsRepository, subgroupsRepository, roomResolver, teacherResolver, lessonTypeResolver) {
        this.itemsRepository = itemsRepository;
        this.schedulesRepository = schedulesRepository;
        this.groupsRepository = groupsRepository;
        this.directionsRepository = directionsRepository;
        this.subjectsRepository = subjectsRepository;
        this.subgroupsRepository = subgroupsRepository;
        this.roomResolver = roomResolver;
        this.teacherResolver = teacherResolver;
        this.lessonTypeResolver = lessonTypeResolver;
    }
    toDate(value) {
        const trimmed = value.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return trimmed.slice(0, 10);
        }
        const [day, month, year] = trimmed.split('.');
        const pad = (part) => part.padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}`;
    }
    async findOrCreateImportDirection() {
        let direction = await this.directionsRepository.findOne({
            where: { code: ScheduleAdminService_1.IMPORT_DIRECTION_CODE },
        });
        if (!direction) {
            direction = await this.directionsRepository.save(this.directionsRepository.create({
                code: ScheduleAdminService_1.IMPORT_DIRECTION_CODE,
                name: 'Импорт расписания',
            }));
        }
        return direction;
    }
    async findOrCreateGroup(groupName) {
        const trimmed = groupName.trim();
        const existing = await this.groupsRepository.findOne({
            where: { name: trimmed },
        });
        if (existing) {
            return existing;
        }
        const direction = await this.findOrCreateImportDirection();
        return this.groupsRepository.save(this.groupsRepository.create({
            name: trimmed,
            directionId: direction.id,
            course: 1,
            educationForm: group_entity_1.EducationForm.FULL_TIME,
        }));
    }
    async findOrCreateSubject(name) {
        const trimmed = name.trim();
        let subject = await this.subjectsRepository.findOne({
            where: { name: trimmed },
        });
        if (!subject) {
            subject = await this.subjectsRepository.save(this.subjectsRepository.create({
                name: trimmed,
                description: null,
            }));
        }
        return subject;
    }
    async findSubgroup(groupId, number) {
        if (!number) {
            return null;
        }
        return this.subgroupsRepository.findOne({
            where: {
                groupId,
                number: number,
            },
        });
    }
    async findScheduleForWeek(groupName, weekStart) {
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
            throw new common_1.BadRequestException('Расписание для этой группы и недели не найдено. Загрузите файл расписания.');
        }
        return schedule;
    }
    async loadItemWithRelations(id) {
        const item = await this.itemsRepository.findOne({
            where: { id },
            relations: [...ITEM_RELATIONS],
        });
        if (!item) {
            throw new common_1.NotFoundException('Занятие не найдено');
        }
        return item;
    }
    async loadExistingSlots(excludeItemId) {
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
        return items.map((item) => (0, schedule_item_mapper_1.mapItemToLessonSlot)(item));
    }
    buildSlotFromDto(dto, groupName) {
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
    async assertNoConflicts(slot, excludeItemId) {
        const existing = await this.loadExistingSlots(excludeItemId);
        const conflicts = (0, schedule_conflict_validator_1.validateScheduleConflicts)([slot], existing);
        if (conflicts.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Изменение отменено: обнаружены конфликты в расписании',
                errors: conflicts.map((conflict) => conflict.message),
            });
        }
    }
    async applySlotFields(item, slot, groupId) {
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
    async createItem(dto) {
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
        return (0, schedule_item_mapper_1.mapItemToDisplayLesson)(await this.loadItemWithRelations(saved.id));
    }
    async updateItem(id, dto) {
        const item = await this.loadItemWithRelations(id);
        const groupName = item.schedule.group?.name;
        if (!groupName) {
            throw new common_1.BadRequestException('У занятия не указана группа');
        }
        const nextSlot = {
            ...(0, schedule_item_mapper_1.mapItemToLessonSlot)(item),
            subject: dto.subject?.trim() ?? item.subject.name,
            lessonType: dto.lessonType?.trim() ?? item.lessonType.name,
            teacherName: dto.teacherName !== undefined
                ? dto.teacherName.trim()
                : (0, schedule_item_mapper_1.mapItemToLessonSlot)(item).teacherName,
            room: dto.room !== undefined ? (dto.room.trim() || null) : (0, schedule_item_mapper_1.mapItemToLessonSlot)(item).room,
            subgroup: dto.subgroup !== undefined ? dto.subgroup : (item.subgroup?.number ?? null),
            dayOfWeek: dto.dayOfWeek ?? item.dayOfWeek,
            startTime: dto.startTime ?? item.startTime,
            endTime: dto.endTime ?? item.endTime,
            weekStart: dto.weekStart ?? (0, schedule_item_mapper_1.mapItemToLessonSlot)(item).weekStart,
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
        }, item.schedule.groupId);
        await this.itemsRepository.save(item);
        return (0, schedule_item_mapper_1.mapItemToDisplayLesson)(await this.loadItemWithRelations(id));
    }
    async disableItem(id) {
        const item = await this.itemsRepository.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Занятие не найдено');
        }
        item.isDisabled = true;
        await this.itemsRepository.save(item);
    }
    async deleteItem(id) {
        const item = await this.itemsRepository.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Занятие не найдено');
        }
        await this.itemsRepository.delete(id);
    }
};
exports.ScheduleAdminService = ScheduleAdminService;
exports.ScheduleAdminService = ScheduleAdminService = ScheduleAdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __param(2, (0, typeorm_1.InjectRepository)(group_entity_1.Group)),
    __param(3, (0, typeorm_1.InjectRepository)(direction_entity_1.Direction)),
    __param(4, (0, typeorm_1.InjectRepository)(subject_entity_1.Subject)),
    __param(5, (0, typeorm_1.InjectRepository)(subgroup_entity_1.Subgroup)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        room_resolver_1.RoomResolver,
        teacher_resolver_1.TeacherResolver,
        lesson_type_resolver_1.LessonTypeResolver])
], ScheduleAdminService);
//# sourceMappingURL=schedule-admin.service.js.map