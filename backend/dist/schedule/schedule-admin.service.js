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
const schedule_slot_utils_1 = require("./parser/schedule-slot.utils");
const schedule_conflict_validator_1 = require("./parser/schedule-conflict.validator");
const lesson_type_resolver_1 = require("./resolver/lesson-type.resolver");
const room_resolver_1 = require("./resolver/room.resolver");
const teacher_resolver_1 = require("./resolver/teacher.resolver");
const schedule_notifier_service_1 = require("./schedule-notifier.service");
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
    scheduleNotifier;
    static IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';
    constructor(itemsRepository, schedulesRepository, groupsRepository, directionsRepository, subjectsRepository, subgroupsRepository, roomResolver, teacherResolver, lessonTypeResolver, scheduleNotifier) {
        this.itemsRepository = itemsRepository;
        this.schedulesRepository = schedulesRepository;
        this.groupsRepository = groupsRepository;
        this.directionsRepository = directionsRepository;
        this.subjectsRepository = subjectsRepository;
        this.subgroupsRepository = subgroupsRepository;
        this.roomResolver = roomResolver;
        this.teacherResolver = teacherResolver;
        this.lessonTypeResolver = lessonTypeResolver;
        this.scheduleNotifier = scheduleNotifier;
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
        const existing = await this.groupsRepository
            .createQueryBuilder('group')
            .where('UPPER(TRIM(group.name)) = UPPER(:name)', { name: trimmed })
            .getOne();
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
        const subgroupNumber = number;
        const existing = await this.subgroupsRepository.findOne({
            where: {
                groupId,
                number: subgroupNumber,
            },
        });
        if (existing) {
            return existing;
        }
        return this.subgroupsRepository.save(this.subgroupsRepository.create({
            groupId,
            number: subgroupNumber,
        }));
    }
    async findScheduleForWeek(groupName, weekStart) {
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
        throw new common_1.BadRequestException('Расписание для этой группы и недели не найдено. Загрузите файл расписания.');
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
    async loadActiveLessonSlots(excludeItemId) {
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
        return items.map((entry) => (0, schedule_item_mapper_1.mapItemToLessonSlot)(entry));
    }
    async assertNoConflicts(candidate, excludeItemId) {
        const existingLessons = await this.loadActiveLessonSlots(excludeItemId);
        const candidateSlot = (0, schedule_item_mapper_1.mapItemToLessonSlot)(candidate);
        const conflicts = (0, schedule_conflict_validator_1.validateScheduleConflicts)([candidateSlot], existingLessons);
        if (conflicts.length === 0) {
            return;
        }
        throw new common_1.BadRequestException({
            message: 'Невозможно сохранить: обнаружен конфликт в расписании',
            errors: conflicts.map((conflict) => conflict.message),
        });
    }
    async createItem(dto) {
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
        this.scheduleNotifier.notifyScheduleChanged('item-created');
        return (0, schedule_item_mapper_1.mapItemToDisplayLesson)(await this.loadItemWithRelations(saved.id));
    }
    async updateItem(id, dto) {
        const item = await this.loadItemWithRelations(id);
        const groupName = item.schedule.group?.name;
        if (!groupName) {
            throw new common_1.BadRequestException('У занятия не указана группа');
        }
        await this.applySlotFields(item, {
            subject: dto.subject?.trim() ?? item.subject.name,
            lessonType: dto.lessonType?.trim() ?? item.lessonType.name,
            teacherName: dto.teacherName !== undefined
                ? dto.teacherName.trim()
                : (0, schedule_item_mapper_1.resolveTeacherName)(item),
            room: dto.room !== undefined
                ? dto.room.trim()
                : (0, schedule_item_mapper_1.formatRoomLabel)(item.room),
            subgroup: dto.subgroup !== undefined
                ? dto.subgroup
                : (item.subgroup?.number ?? null),
            dayOfWeek: dto.dayOfWeek ?? item.dayOfWeek,
            startTime: dto.startTime ?? item.startTime,
            endTime: dto.endTime ?? item.endTime,
            weekStart: dto.weekStart ?? (0, schedule_slot_utils_1.normalizeWeekStart)(String(item.weekStart)),
            comment: dto.comment !== undefined
                ? (dto.comment?.trim() || null)
                : undefined,
        }, item.schedule.groupId);
        await this.assertNoConflicts(item, id);
        await this.itemsRepository.save(item);
        this.scheduleNotifier.notifyScheduleChanged('item-updated');
        return (0, schedule_item_mapper_1.mapItemToDisplayLesson)(await this.loadItemWithRelations(id));
    }
    async disableItem(id) {
        const item = await this.itemsRepository.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Занятие не найдено');
        }
        item.isDisabled = true;
        await this.itemsRepository.save(item);
        this.scheduleNotifier.notifyScheduleChanged('item-disabled');
    }
    async deleteItem(id) {
        const item = await this.itemsRepository.findOne({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException('Занятие не найдено');
        }
        await this.itemsRepository.delete(id);
        this.scheduleNotifier.notifyScheduleChanged('item-deleted');
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
        lesson_type_resolver_1.LessonTypeResolver,
        schedule_notifier_service_1.ScheduleNotifierService])
], ScheduleAdminService);
//# sourceMappingURL=schedule-admin.service.js.map