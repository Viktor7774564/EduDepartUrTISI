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
const schedule_preholiday_day_entity_1 = require("./entities/schedule-preholiday-day.entity");
const schedule_item_mapper_1 = require("./schedule-item.mapper");
const schedule_slot_utils_1 = require("./parser/schedule-slot.utils");
const schedule_conflict_validator_1 = require("./parser/schedule-conflict.validator");
const lesson_type_resolver_1 = require("./resolver/lesson-type.resolver");
const room_resolver_1 = require("./resolver/room.resolver");
const teacher_resolver_1 = require("./resolver/teacher.resolver");
const schedule_notifier_service_1 = require("./schedule-notifier.service");
const notifications_service_1 = require("../notifications/notifications.service");
const ITEM_RELATIONS = [
    'schedule',
    'schedule.group',
    'subject',
    'subgroup',
    'lessonType',
    'teacher',
    'room',
];
const DAY_LABELS = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
};
const WEEKDAY_TRANSFER_TIME_SLOTS = [
    { startTime: '08:30', endTime: '10:00' },
    { startTime: '10:15', endTime: '11:45' },
    { startTime: '12:00', endTime: '13:30' },
    { startTime: '14:15', endTime: '15:45' },
    { startTime: '16:00', endTime: '17:30' },
    { startTime: '17:40', endTime: '19:05' },
    { startTime: '19:15', endTime: '20:40' },
];
const SATURDAY_TRANSFER_TIME_SLOTS = [
    { startTime: '08:30', endTime: '10:00' },
    { startTime: '10:15', endTime: '11:45' },
    { startTime: '12:00', endTime: '13:30' },
    { startTime: '13:45', endTime: '15:15' },
    { startTime: '15:30', endTime: '17:00' },
    { startTime: '17:40', endTime: '19:05' },
];
const PREHOLIDAY_TRANSFER_TIME_SLOTS = [
    { startTime: '08:30', endTime: '10:00' },
    { startTime: '10:15', endTime: '11:45' },
    { startTime: '12:00', endTime: '13:30' },
    { startTime: '13:45', endTime: '14:45' },
    { startTime: '15:00', endTime: '16:00' },
];
const PUBLIC_HOLIDAYS = new Set([
    '01-01',
    '01-02',
    '01-03',
    '01-04',
    '01-05',
    '01-06',
    '01-07',
    '01-08',
    '02-23',
    '03-08',
    '05-01',
    '05-09',
    '06-12',
    '11-04',
]);
let ScheduleAdminService = class ScheduleAdminService {
    static { ScheduleAdminService_1 = this; }
    itemsRepository;
    schedulesRepository;
    groupsRepository;
    directionsRepository;
    subjectsRepository;
    subgroupsRepository;
    preholidayDaysRepository;
    roomResolver;
    teacherResolver;
    lessonTypeResolver;
    scheduleNotifier;
    notificationsService;
    static IMPORT_DIRECTION_CODE = 'SCHEDULE_IMPORT';
    constructor(itemsRepository, schedulesRepository, groupsRepository, directionsRepository, subjectsRepository, subgroupsRepository, preholidayDaysRepository, roomResolver, teacherResolver, lessonTypeResolver, scheduleNotifier, notificationsService) {
        this.itemsRepository = itemsRepository;
        this.schedulesRepository = schedulesRepository;
        this.groupsRepository = groupsRepository;
        this.directionsRepository = directionsRepository;
        this.subjectsRepository = subjectsRepository;
        this.subgroupsRepository = subgroupsRepository;
        this.preholidayDaysRepository = preholidayDaysRepository;
        this.roomResolver = roomResolver;
        this.teacherResolver = teacherResolver;
        this.lessonTypeResolver = lessonTypeResolver;
        this.scheduleNotifier = scheduleNotifier;
        this.notificationsService = notificationsService;
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
    normalizeTeacherLabel(rawTeacherName) {
        const trimmed = rawTeacherName?.trim().replace(/\s+/g, ' ') ?? '';
        if (!trimmed) {
            return '';
        }
        const initialsMatch = trimmed.match(/^([A-Za-zА-ЯЁа-яё-]+)\s+([A-Za-zА-ЯЁ])\.?\s*([A-Za-zА-ЯЁ])\.?$/u);
        if (initialsMatch) {
            const surname = initialsMatch[1];
            const nameInitial = initialsMatch[2].toUpperCase();
            const patronymicInitial = initialsMatch[3].toUpperCase();
            return `${surname} ${nameInitial}.${patronymicInitial}.`;
        }
        const compactInitialsMatch = trimmed.match(/^([A-Za-zА-ЯЁа-яё-]+)\s+([A-Za-zА-ЯЁ])\.?([A-Za-zА-ЯЁ])\.?$/u);
        if (compactInitialsMatch) {
            const surname = compactInitialsMatch[1];
            const nameInitial = compactInitialsMatch[2].toUpperCase();
            const patronymicInitial = compactInitialsMatch[3].toUpperCase();
            return `${surname} ${nameInitial}.${patronymicInitial}.`;
        }
        const fullNameParts = trimmed.split(' ');
        if (fullNameParts.length >= 3) {
            const surname = fullNameParts[0];
            const nameInitial = fullNameParts[1].charAt(0).toUpperCase();
            const patronymicInitial = fullNameParts[2].charAt(0).toUpperCase();
            if (nameInitial && patronymicInitial) {
                return `${surname} ${nameInitial}.${patronymicInitial}.`;
            }
        }
        return trimmed;
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
        const normalizedTeacherName = this.normalizeTeacherLabel(slot.teacherName);
        const teacher = normalizedTeacherName
            ? await this.teacherResolver.resolve(normalizedTeacherName)
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
        item.legacyTeacherName = teacher ? null : (normalizedTeacherName || null);
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
    parseRecommendationDate(weekStart, dayOfWeek) {
        const normalizedWeekStart = (0, schedule_slot_utils_1.normalizeWeekStart)(weekStart);
        const [day, month, year] = normalizedWeekStart.split('.');
        if (!day || !month || !year) {
            return null;
        }
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        date.setDate(date.getDate() + dayOfWeek - 1);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    isPublicHoliday(weekStart, dayOfWeek) {
        const date = this.parseRecommendationDate(weekStart, dayOfWeek);
        if (!date) {
            return false;
        }
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return PUBLIC_HOLIDAYS.has(`${month}-${day}`);
    }
    isWeekInPast(weekStart) {
        const normalizedWeekStart = (0, schedule_slot_utils_1.normalizeWeekStart)(this.toDate(weekStart));
        const [day, month, year] = normalizedWeekStart.split('.');
        if (!day || !month || !year) {
            return false;
        }
        const weekStartDate = new Date(Number(year), Number(month) - 1, Number(day));
        if (Number.isNaN(weekStartDate.getTime())) {
            return false;
        }
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        weekEndDate.setHours(0, 0, 0, 0);
        return weekEndDate < today;
    }
    getDateKey(weekStart, dayOfWeek) {
        const date = this.parseRecommendationDate(weekStart, dayOfWeek);
        if (!date) {
            return '';
        }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
    async loadPreholidayDayKeys(weekStart) {
        const weekStartDate = this.parseRecommendationDate(weekStart, 1);
        if (!weekStartDate) {
            return new Set();
        }
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 6);
        const toIso = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${year}-${month}-${day}`;
        };
        const days = await this.preholidayDaysRepository
            .createQueryBuilder('preholiday')
            .where('preholiday.date >= :from', { from: toIso(weekStartDate) })
            .andWhere('preholiday.date <= :to', { to: toIso(weekEndDate) })
            .getMany();
        return new Set(days.map((day) => day.date));
    }
    getRecommendationSlots(weekStart, dayOfWeek, preholidayDayKeys) {
        const dateKey = this.getDateKey(weekStart, dayOfWeek);
        if (dateKey && preholidayDayKeys.has(dateKey)) {
            return PREHOLIDAY_TRANSFER_TIME_SLOTS;
        }
        return dayOfWeek === 6
            ? SATURDAY_TRANSFER_TIME_SLOTS
            : WEEKDAY_TRANSFER_TIME_SLOTS;
    }
    getBaseSlotsForDay(dayOfWeek) {
        return dayOfWeek === 6
            ? SATURDAY_TRANSFER_TIME_SLOTS
            : WEEKDAY_TRANSFER_TIME_SLOTS;
    }
    getOriginalTimeIndex(source) {
        const originalSlots = source.dayOfWeek === 6
            ? SATURDAY_TRANSFER_TIME_SLOTS
            : WEEKDAY_TRANSFER_TIME_SLOTS;
        return originalSlots.findIndex((slot) => slot.startTime === source.startTime);
    }
    scoreDayLoadWithCandidate(candidate, sameGroupDayLessons) {
        if (sameGroupDayLessons.length === 0) {
            return { score: 6, reason: 'день у группы свободный' };
        }
        const allTimes = [...sameGroupDayLessons.map((lesson) => lesson.startTime), candidate.startTime]
            .map((time) => this.getMinutes(time))
            .sort((left, right) => left - right);
        let longBreaks = 0;
        for (let index = 1; index < allTimes.length; index += 1) {
            if ((allTimes[index] - allTimes[index - 1]) > 120) {
                longBreaks += 1;
            }
        }
        if (longBreaks === 0) {
            return { score: 14, reason: 'без длинных окон у группы' };
        }
        if (longBreaks === 1) {
            return { score: 6, reason: 'одно окно у группы' };
        }
        return { score: -8, reason: 'создаёт несколько окон у группы' };
    }
    scoreTeacherLoad(candidate, sameTeacherDayLessons) {
        if (!candidate.teacherName) {
            return { score: 0 };
        }
        if (sameTeacherDayLessons.length === 0) {
            return { score: 0 };
        }
        const candidateMinutes = this.getMinutes(candidate.startTime);
        const nearestDistance = sameTeacherDayLessons
            .map((lesson) => Math.abs(this.getMinutes(lesson.startTime) - candidateMinutes))
            .sort((left, right) => left - right)[0] ?? 9999;
        if (nearestDistance <= 120) {
            return { score: 10, reason: 'преподавателю удобно по расписанию дня' };
        }
        return { score: 3, reason: 'преподаватель уже работает в этот день' };
    }
    getMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours * 60) + minutes;
    }
    scoreRecommendation(candidate, source, existingLessons) {
        let score = 0;
        const reasons = ['нет конфликтов по группе, преподавателю и аудитории'];
        if (candidate.dayOfWeek === source.dayOfWeek) {
            score += 30;
            reasons.push('тот же день недели');
        }
        if (candidate.startTime === source.startTime) {
            score += 20;
            reasons.push('то же время пары');
        }
        const originalTimeIndex = this.getOriginalTimeIndex(source);
        const candidateTimeIndex = this.getBaseSlotsForDay(candidate.dayOfWeek)
            .findIndex((slot) => slot.startTime === candidate.startTime);
        if (originalTimeIndex !== -1 && candidateTimeIndex !== -1) {
            const distance = Math.abs(originalTimeIndex - candidateTimeIndex);
            if (distance === 0) {
                score += 10;
            }
            else if (distance === 1) {
                score += 5;
                reasons.push('близко к исходной паре');
            }
            else if (distance >= 3) {
                score -= 4;
                reasons.push('далеко от исходной пары');
            }
        }
        if (candidate.dayOfWeek === 6) {
            score -= 10;
            reasons.push('суббота');
        }
        else {
            score += 8;
        }
        const sameGroupDayLessons = existingLessons.filter((lesson) => lesson.groupName === candidate.groupName
            && lesson.weekStart === candidate.weekStart
            && lesson.dayOfWeek === candidate.dayOfWeek);
        const groupDayScore = this.scoreDayLoadWithCandidate(candidate, sameGroupDayLessons);
        score += groupDayScore.score;
        if (groupDayScore.reason) {
            reasons.push(groupDayScore.reason);
        }
        const sameTeacherDayLessons = existingLessons.filter((lesson) => lesson.teacherName
            && lesson.teacherName === candidate.teacherName
            && lesson.weekStart === candidate.weekStart
            && lesson.dayOfWeek === candidate.dayOfWeek);
        const teacherScore = this.scoreTeacherLoad(candidate, sameTeacherDayLessons);
        score += teacherScore.score;
        if (teacherScore.reason) {
            reasons.push(teacherScore.reason);
        }
        if (candidate.startTime <= '16:00') {
            score += 8;
        }
        else if (candidate.startTime < '17:40') {
            score += 3;
        }
        else {
            score -= 6;
            reasons.push('поздняя пара');
        }
        if (candidate.weekStart !== source.weekStart) {
            score -= 3;
            reasons.push('другая неделя');
        }
        return { score, reasons };
    }
    buildCandidateSlot(source, weekStart, dayOfWeek, startTime, endTime) {
        return {
            ...source,
            weekStart,
            dayOfWeek,
            startTime,
            endTime,
        };
    }
    async getTransferRecommendations(id, weekStart) {
        const item = await this.loadItemWithRelations(id);
        const sourceSlot = (0, schedule_item_mapper_1.mapItemToLessonSlot)(item);
        const targetWeekStart = (0, schedule_slot_utils_1.normalizeWeekStart)(weekStart ? this.toDate(weekStart) : String(item.weekStart));
        if (this.isWeekInPast(targetWeekStart)) {
            return [];
        }
        const existingLessons = await this.loadActiveLessonSlots(id);
        const preholidayDayKeys = await this.loadPreholidayDayKeys(targetWeekStart);
        const recommendations = [];
        for (const [dayOfWeekValue, dayLabel] of Object.entries(DAY_LABELS)) {
            const dayOfWeek = Number(dayOfWeekValue);
            const dateKey = this.getDateKey(targetWeekStart, dayOfWeek);
            const isPreholidayDay = Boolean(dateKey && preholidayDayKeys.has(dateKey));
            if (this.isPublicHoliday(targetWeekStart, dayOfWeek)) {
                continue;
            }
            for (const slot of this.getRecommendationSlots(targetWeekStart, dayOfWeek, preholidayDayKeys)) {
                const candidate = this.buildCandidateSlot(sourceSlot, targetWeekStart, dayOfWeek, slot.startTime, slot.endTime);
                const isOriginalSlot = sourceSlot.weekStart === candidate.weekStart
                    && sourceSlot.dayOfWeek === candidate.dayOfWeek
                    && sourceSlot.startTime === candidate.startTime;
                if (isOriginalSlot) {
                    continue;
                }
                const conflicts = (0, schedule_conflict_validator_1.validateScheduleConflicts)([candidate], existingLessons);
                if (conflicts.length > 0) {
                    continue;
                }
                const { score, reasons } = this.scoreRecommendation(candidate, sourceSlot, existingLessons);
                const recommendationReasons = isPreholidayDay
                    ? [...reasons, 'предпраздничный день (короткие пары)']
                    : reasons;
                recommendations.push({
                    weekStart: targetWeekStart,
                    dayOfWeek,
                    day: dayLabel,
                    startTime: candidate.startTime,
                    endTime: candidate.endTime,
                    label: `${dayLabel}, ${candidate.startTime} - ${candidate.endTime}`,
                    reasons: recommendationReasons,
                    score,
                });
            }
        }
        return recommendations
            .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }
            if (left.dayOfWeek !== right.dayOfWeek) {
                return left.dayOfWeek - right.dayOfWeek;
            }
            return left.startTime.localeCompare(right.startTime);
        })
            .slice(0, 5)
            .map((recommendation) => ({
            weekStart: recommendation.weekStart,
            dayOfWeek: recommendation.dayOfWeek,
            day: recommendation.day,
            startTime: recommendation.startTime,
            endTime: recommendation.endTime,
            label: recommendation.label,
            reasons: recommendation.reasons,
        }));
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
        const savedWithRelations = await this.loadItemWithRelations(saved.id);
        this.scheduleNotifier.notifyScheduleChanged('item-created');
        await this.notificationsService.notifyScheduleItemChanged('created', savedWithRelations);
        return (0, schedule_item_mapper_1.mapItemToDisplayLesson)(savedWithRelations);
    }
    async updateItem(id, dto) {
        const item = await this.loadItemWithRelations(id);
        const previousItem = this.notificationsService.createScheduleItemSnapshot(item);
        const groupName = item.schedule.group?.name;
        if (!groupName) {
            throw new common_1.BadRequestException('У занятия не указана группа');
        }
        const currentWeekStart = (0, schedule_slot_utils_1.normalizeWeekStart)(String(item.weekStart));
        const nextWeekStart = dto.weekStart !== undefined
            ? (0, schedule_slot_utils_1.normalizeWeekStart)(this.toDate(dto.weekStart))
            : currentWeekStart;
        if (this.isWeekInPast(nextWeekStart) && nextWeekStart !== currentWeekStart) {
            throw new common_1.BadRequestException('Нельзя перенести пару на прошедшую неделю');
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
        const updatedWithRelations = await this.loadItemWithRelations(id);
        this.scheduleNotifier.notifyScheduleChanged('item-updated');
        await this.notificationsService.notifyScheduleItemChanged('updated', updatedWithRelations, previousItem);
        return (0, schedule_item_mapper_1.mapItemToDisplayLesson)(updatedWithRelations);
    }
    async disableItem(id) {
        const item = await this.loadItemWithRelations(id);
        if (!item) {
            throw new common_1.NotFoundException('Занятие не найдено');
        }
        item.isDisabled = true;
        await this.itemsRepository.save(item);
        const disabledWithRelations = await this.loadItemWithRelations(id);
        this.scheduleNotifier.notifyScheduleChanged('item-disabled');
        await this.notificationsService.notifyScheduleItemChanged('disabled', disabledWithRelations);
    }
    async deleteItem(id) {
        const item = await this.loadItemWithRelations(id);
        await this.itemsRepository.delete(id);
        this.scheduleNotifier.notifyScheduleChanged('item-deleted');
        await this.notificationsService.notifyScheduleItemChanged('deleted', item);
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
    __param(6, (0, typeorm_1.InjectRepository)(schedule_preholiday_day_entity_1.SchedulePreholidayDay)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        room_resolver_1.RoomResolver,
        teacher_resolver_1.TeacherResolver,
        lesson_type_resolver_1.LessonTypeResolver,
        schedule_notifier_service_1.ScheduleNotifierService,
        notifications_service_1.NotificationsService])
], ScheduleAdminService);
//# sourceMappingURL=schedule-admin.service.js.map