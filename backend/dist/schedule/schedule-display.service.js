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
const parsed_schedule_lesson_entity_1 = require("./entities/parsed-schedule-lesson.entity");
const schedule_upload_entity_1 = require("./entities/schedule-upload.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const DAY_LABELS = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};
const BUILDING_OPTIONS = ['УК1', 'УК2', 'УК3', 'УК4', 'УК5'];
let ScheduleDisplayService = class ScheduleDisplayService {
    parsedLessonsRepository;
    uploadsRepository;
    constructor(parsedLessonsRepository, uploadsRepository) {
        this.parsedLessonsRepository = parsedLessonsRepository;
        this.uploadsRepository = uploadsRepository;
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
    formatTime(value) {
        return value.slice(0, 5);
    }
    formatRoom(lesson) {
        if (lesson.room?.trim()) {
            return lesson.room.trim();
        }
        if (lesson.isDistance) {
            return 'дист. форм. об.';
        }
        return '';
    }
    mapLesson(lesson) {
        return {
            id: lesson.id,
            day: DAY_LABELS[lesson.dayOfWeek] ?? '',
            startTime: this.formatTime(lesson.startTime),
            endTime: this.formatTime(lesson.endTime),
            subject: lesson.subject,
            teacher: lesson.teacherName,
            type: lesson.lessonType,
            room: this.formatRoom(lesson),
            group: lesson.groupName,
            subgroup: lesson.subgroup,
            isSameCellParallel: lesson.isSameCellParallel,
        };
    }
    buildWeeksFromLessons(lessons) {
        const weeks = new Map();
        const weekOrder = [];
        for (const lesson of lessons) {
            const weekLabel = this.formatWeekLabel(String(lesson.weekStart));
            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }
            weeks.get(weekLabel)?.push(this.mapLesson(lesson));
        }
        const orderedWeeks = {};
        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }
        return orderedWeeks;
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
    async getDistinctRooms() {
        const rows = await this.parsedLessonsRepository
            .createQueryBuilder('lesson')
            .select('DISTINCT lesson.room', 'room')
            .where('lesson.room IS NOT NULL')
            .andWhere("TRIM(lesson.room) <> ''")
            .getRawMany();
        return rows
            .map((row) => row.room?.trim())
            .filter((room) => Boolean(room) && !this.isDistanceRoom(room))
            .sort((left, right) => left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true }));
    }
    async listGroups() {
        const uploads = await this.uploadsRepository.find({
            where: {
                parseStatus: schedule_upload_entity_1.ScheduleParseStatus.SUCCESS,
                scheduleType: schedule_entity_1.ScheduleType.STUDENT,
            },
            select: ['groupName', 'facultyName'],
            order: { uploadedAt: 'DESC' },
        });
        const groups = new Map();
        for (const upload of uploads) {
            if (!upload.groupName) {
                continue;
            }
            const key = this.normalizeText(upload.groupName);
            if (!groups.has(key)) {
                groups.set(key, {
                    groupName: upload.groupName,
                    facultyName: upload.facultyName,
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
        const lessons = await this.parsedLessonsRepository
            .createQueryBuilder('lesson')
            .where('UPPER(TRIM(lesson.groupName)) = :groupName', {
            groupName: normalizedGroupName,
        })
            .orderBy('lesson.weekStart', 'ASC')
            .addOrderBy('lesson.dayOfWeek', 'ASC')
            .addOrderBy('lesson.startTime', 'ASC')
            .getMany();
        return {
            groupName: lessons[0]?.groupName ?? groupName.trim(),
            weeks: this.buildWeeksFromLessons(lessons),
        };
    }
    async listTeachers() {
        const rows = await this.parsedLessonsRepository
            .createQueryBuilder('lesson')
            .select('DISTINCT lesson.teacherName', 'teacherName')
            .where("TRIM(lesson.teacherName) <> ''")
            .orderBy('lesson.teacherName', 'ASC')
            .getRawMany();
        return rows
            .map((row) => row.teacherName?.trim())
            .filter((teacher) => Boolean(teacher));
    }
    async getTeacherSchedule(teacherName) {
        const normalizedTeacherName = this.normalizeText(teacherName);
        const lessons = await this.parsedLessonsRepository
            .createQueryBuilder('lesson')
            .where('UPPER(TRIM(lesson.teacherName)) = :teacherName', {
            teacherName: normalizedTeacherName,
        })
            .orderBy('lesson.weekStart', 'ASC')
            .addOrderBy('lesson.dayOfWeek', 'ASC')
            .addOrderBy('lesson.startTime', 'ASC')
            .getMany();
        return {
            teacherName: lessons[0]?.teacherName ?? teacherName.trim(),
            weeks: this.buildWeeksFromLessons(lessons),
        };
    }
    async listBuildings() {
        const rooms = await this.getDistinctRooms();
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
        const rooms = await this.getDistinctRooms();
        if (!building?.trim()) {
            return rooms;
        }
        const normalizedBuilding = building.trim().toUpperCase();
        return rooms.filter((room) => this.getBuildingFromRoom(room)?.toUpperCase() === normalizedBuilding);
    }
    async getRoomSchedule(roomName) {
        const normalizedRoomName = this.normalizeText(roomName);
        const lessons = await this.parsedLessonsRepository
            .createQueryBuilder('lesson')
            .where('UPPER(TRIM(lesson.room)) = :roomName', {
            roomName: normalizedRoomName,
        })
            .orderBy('lesson.weekStart', 'ASC')
            .addOrderBy('lesson.dayOfWeek', 'ASC')
            .addOrderBy('lesson.startTime', 'ASC')
            .getMany();
        return {
            room: lessons[0]?.room?.trim() ?? roomName.trim(),
            weeks: this.buildWeeksFromLessons(lessons),
        };
    }
};
exports.ScheduleDisplayService = ScheduleDisplayService;
exports.ScheduleDisplayService = ScheduleDisplayService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(parsed_schedule_lesson_entity_1.ParsedScheduleLesson)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_upload_entity_1.ScheduleUpload)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ScheduleDisplayService);
//# sourceMappingURL=schedule-display.service.js.map