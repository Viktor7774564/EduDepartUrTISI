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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleDisplayService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_item_mapper_1 = require("./schedule-item.mapper");
const BUILDING_OPTIONS = ['УК1', 'УК2', 'УК3', 'УК4', 'УК5'];
const ITEM_RELATIONS = [
    'schedule',
    'schedule.group',
    'schedule.upload',
    'subject',
    'subgroup',
    'lessonType',
    'teacher',
    'room',
];
let ScheduleDisplayService = class ScheduleDisplayService {
    itemsRepository;
    schedulesRepository;
    constructor(itemsRepository, schedulesRepository) {
        this.itemsRepository = itemsRepository;
        this.schedulesRepository = schedulesRepository;
    }
    normalizeText(value) {
        return value.trim().toUpperCase();
    }
    parseDateValue(value) {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        const dottedMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dottedMatch) {
            return new Date(Number(dottedMatch[3]), Number(dottedMatch[2]) - 1, Number(dottedMatch[1]));
        }
        return new Date(value);
    }
    formatWeekLabel(weekStart) {
        const start = this.parseDateValue(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const pad = (part) => String(part).padStart(2, '0');
        return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}`;
    }
    buildWeeksFromItems(items) {
        const weeks = new Map();
        const weekOrder = [];
        for (const item of items) {
            const weekLabel = this.formatWeekLabel(String(item.weekStart));
            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }
            weeks.get(weekLabel)?.push((0, schedule_item_mapper_1.mapItemToDisplayLesson)(item));
        }
        const orderedWeeks = {};
        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }
        return orderedWeeks;
    }
    baseItemsQuery() {
        return this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .leftJoinAndSelect('schedule.upload', 'upload')
            .leftJoinAndSelect('item.subject', 'subject')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .leftJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .where('item.isDisabled = false')
            .andWhere('schedule.isActive = true')
            .orderBy('item.weekStart', 'ASC')
            .addOrderBy('item.dayOfWeek', 'ASC')
            .addOrderBy('item.startTime', 'ASC');
    }
    getBuildingFromRoom(room) {
        const normalized = room.trim().toUpperCase();
        if (normalized.includes('УК1')) {
            return 'УК1';
        }
        if (normalized.includes('УК2') || normalized.includes('УК№2')) {
            return 'УК2';
        }
        if (normalized.includes('УК3') || normalized.includes('УК№3')) {
            return 'УК3';
        }
        if (normalized.includes('УК4') || normalized.includes('УК№4')) {
            return 'УК4';
        }
        if (normalized.includes('УК5') || normalized.includes('УК№5')) {
            return 'УК5';
        }
        if (normalized.startsWith('VII')
            || normalized.startsWith('VIII')
            || normalized.startsWith('VI ')
            || normalized.startsWith('V ')
            || normalized.startsWith('II ')
            || normalized.startsWith('7 ')
            || normalized.startsWith('8 ')
            || normalized.startsWith('5 ')
            || normalized.startsWith('6 ')
            || normalized.startsWith('2 ')) {
            return 'УК3';
        }
        if (normalized.startsWith('III')
            || normalized.startsWith('IV')
            || normalized.startsWith('I ')
            || normalized.startsWith('1 ')
            || normalized.startsWith('3 ')
            || normalized.startsWith('4 ')) {
            return 'УК5';
        }
        return null;
    }
    isDistanceRoom(room) {
        return /дист/i.test(room);
    }
    async listGroups() {
        const schedules = await this.schedulesRepository.find({
            where: {
                scheduleType: schedule_entity_1.ScheduleType.STUDENT,
                isActive: true,
            },
            relations: ['group', 'upload'],
            order: { validFrom: 'DESC' },
        });
        const groups = new Map();
        for (const schedule of schedules) {
            if (!schedule.group?.name) {
                continue;
            }
            const key = this.normalizeText(schedule.group.name);
            if (!groups.has(key)) {
                groups.set(key, {
                    groupName: schedule.group.name,
                    facultyName: schedule.upload?.facultyName ?? null,
                });
            }
        }
        return Array.from(groups.values()).sort((left, right) => left.groupName.localeCompare(right.groupName, 'ru', {
            sensitivity: 'base',
            numeric: true,
        }));
    }
    async getGroupSchedule(groupName) {
        const normalizedGroupName = this.normalizeText(groupName);
        const items = await this.baseItemsQuery()
            .andWhere('UPPER(TRIM(group.name)) = :groupName', {
            groupName: normalizedGroupName,
        })
            .getMany();
        return {
            groupName: items[0]?.schedule?.group?.name ?? groupName.trim(),
            weeks: this.buildWeeksFromItems(items),
        };
    }
    async listTeachers() {
        const items = await this.baseItemsQuery().getMany();
        const teachers = new Set();
        for (const item of items) {
            if (item.teacher) {
                teachers.add((0, schedule_item_mapper_1.formatTeacherName)(item.teacher));
                continue;
            }
            const legacyName = item.legacyTeacherName?.trim();
            if (legacyName) {
                teachers.add(legacyName);
            }
        }
        return Array.from(teachers).sort((left, right) => left.localeCompare(right, 'ru', { sensitivity: 'base' }));
    }
    async getTeacherSchedule(teacherName) {
        const normalizedTeacherName = this.normalizeText(teacherName);
        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) => {
            const resolvedName = item.teacher
                ? (0, schedule_item_mapper_1.formatTeacherName)(item.teacher)
                : item.legacyTeacherName?.trim() ?? '';
            return this.normalizeText(resolvedName) === normalizedTeacherName;
        });
        const resolvedTeacherName = matchedItems[0]
            ? (matchedItems[0].teacher
                ? (0, schedule_item_mapper_1.formatTeacherName)(matchedItems[0].teacher)
                : matchedItems[0].legacyTeacherName?.trim() ?? teacherName.trim())
            : teacherName.trim();
        return {
            teacherName: resolvedTeacherName,
            weeks: this.buildWeeksFromItems(matchedItems),
        };
    }
    async listBuildings() {
        const rooms = await this.listRooms();
        const buildings = new Set();
        for (const room of rooms) {
            const building = this.getBuildingFromRoom(room);
            if (building) {
                buildings.add(building);
            }
        }
        return BUILDING_OPTIONS.filter((building) => buildings.has(building));
    }
    async listRooms(building) {
        const items = await this.baseItemsQuery().getMany();
        const rooms = new Set();
        for (const item of items) {
            const label = (0, schedule_item_mapper_1.formatRoomLabel)(item.room);
            if (label && !this.isDistanceRoom(label)) {
                rooms.add(label);
            }
        }
        const roomList = Array.from(rooms).sort((left, right) => left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true }));
        if (!building?.trim()) {
            return roomList;
        }
        const normalizedBuilding = building.trim().toUpperCase();
        return roomList.filter((room) => this.getBuildingFromRoom(room)?.toUpperCase() === normalizedBuilding);
    }
    async getRoomSchedule(roomName) {
        const normalizedRoomName = this.normalizeText(roomName);
        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) => this.normalizeText((0, schedule_item_mapper_1.formatRoomLabel)(item.room)) === normalizedRoomName);
        return {
            room: matchedItems[0]
                ? (0, schedule_item_mapper_1.formatRoomLabel)(matchedItems[0].room)
                : roomName.trim(),
            weeks: this.buildWeeksFromItems(matchedItems),
        };
    }
};
exports.ScheduleDisplayService = ScheduleDisplayService;
exports.ScheduleDisplayService = ScheduleDisplayService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ScheduleDisplayService);
//# sourceMappingURL=schedule-display.service.js.map