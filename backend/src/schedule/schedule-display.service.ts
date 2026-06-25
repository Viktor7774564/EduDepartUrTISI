import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ScheduleItem } from './entities/schedule-item.entity';
import { Schedule, ScheduleType } from './entities/schedule.entity';
import {
    formatRoomLabel,
    formatTeacherName,
    mapItemToDisplayLesson,
} from './schedule-item.mapper';

const BUILDING_OPTIONS = ['УК1', 'УК2', 'УК3', 'УК4', 'УК5'] as const;

const ITEM_RELATIONS = [
    'schedule',
    'schedule.group',
    'schedule.upload',
    'subject',
    'subgroup',
    'lessonType',
    'teacher',
    'room',
] as const;

export interface ScheduleGroupInfo {
    groupName: string;
    facultyName: string | null;
}

export interface ScheduleDisplayLesson {
    id: number;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    teacher: string;
    type: string;
    room: string;
    group: string;
    subgroup: number | null;
    isSameCellParallel: boolean;
}

export interface GroupScheduleResponse {
    groupName: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
}

export interface TeacherScheduleResponse {
    teacherName: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
}

export interface RoomScheduleResponse {
    room: string;
    weeks: Record<string, ScheduleDisplayLesson[]>;
}

@Injectable()
export class ScheduleDisplayService {
    constructor(
        @InjectRepository(ScheduleItem)
        private readonly itemsRepository: Repository<ScheduleItem>,
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
    ) {}

    private normalizeText(value: string): string {
        return value.trim().toUpperCase();
    }

    private parseDateValue(value: string): Date {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        const dottedMatch = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (dottedMatch) {
            return new Date(
                Number(dottedMatch[3]),
                Number(dottedMatch[2]) - 1,
                Number(dottedMatch[1]),
            );
        }

        return new Date(value);
    }

    private formatWeekLabel(weekStart: string): string {
        const start = this.parseDateValue(weekStart);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const pad = (part: number) => String(part).padStart(2, '0');

        return `${pad(start.getDate())}.${pad(start.getMonth() + 1)} - ${pad(end.getDate())}.${pad(end.getMonth() + 1)}`;
    }

    private buildWeeksFromItems(items: ScheduleItem[]): Record<string, ScheduleDisplayLesson[]> {
        const weeks = new Map<string, ScheduleDisplayLesson[]>();
        const weekOrder: string[] = [];

        for (const item of items) {
            const weekLabel = this.formatWeekLabel(String(item.weekStart));

            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }

            weeks.get(weekLabel)?.push(mapItemToDisplayLesson(item));
        }

        const orderedWeeks: Record<string, ScheduleDisplayLesson[]> = {};

        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }

        return orderedWeeks;
    }

    private baseItemsQuery() {
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

    getBuildingFromRoom(room: string): string | null {
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

        if (
            normalized.startsWith('VII')
            || normalized.startsWith('VIII')
            || normalized.startsWith('VI ')
            || normalized.startsWith('V ')
            || normalized.startsWith('II ')
            || normalized.startsWith('7 ')
            || normalized.startsWith('8 ')
            || normalized.startsWith('5 ')
            || normalized.startsWith('6 ')
            || normalized.startsWith('2 ')
        ) {
            return 'УК3';
        }

        if (
            normalized.startsWith('III')
            || normalized.startsWith('IV')
            || normalized.startsWith('I ')
            || normalized.startsWith('1 ')
            || normalized.startsWith('3 ')
            || normalized.startsWith('4 ')
        ) {
            return 'УК5';
        }

        return null;
    }

    private isDistanceRoom(room: string): boolean {
        return /дист/i.test(room);
    }

    async listGroups(): Promise<ScheduleGroupInfo[]> {
        const schedules = await this.schedulesRepository.find({
            where: {
                scheduleType: ScheduleType.STUDENT,
                isActive: true,
            },
            relations: ['group', 'upload'],
            order: { validFrom: 'DESC' },
        });

        const groups = new Map<string, ScheduleGroupInfo>();

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

        return Array.from(groups.values()).sort((left, right) =>
            left.groupName.localeCompare(right.groupName, 'ru', {
                sensitivity: 'base',
                numeric: true,
            }),
        );
    }

    async getGroupSchedule(groupName: string): Promise<GroupScheduleResponse> {
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

    async listTeachers(): Promise<string[]> {
        const items = await this.baseItemsQuery().getMany();
        const teachers = new Set<string>();

        for (const item of items) {
            if (item.teacher) {
                teachers.add(formatTeacherName(item.teacher));
                continue;
            }

            const legacyName = item.legacyTeacherName?.trim();
            if (legacyName) {
                teachers.add(legacyName);
            }
        }

        return Array.from(teachers).sort((left, right) =>
            left.localeCompare(right, 'ru', { sensitivity: 'base' }),
        );
    }

    async getTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse> {
        const normalizedTeacherName = this.normalizeText(teacherName);

        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) => {
            const resolvedName = item.teacher
                ? formatTeacherName(item.teacher)
                : item.legacyTeacherName?.trim() ?? '';

            return this.normalizeText(resolvedName) === normalizedTeacherName;
        });

        const resolvedTeacherName = matchedItems[0]
            ? (matchedItems[0].teacher
                ? formatTeacherName(matchedItems[0].teacher)
                : matchedItems[0].legacyTeacherName?.trim() ?? teacherName.trim())
            : teacherName.trim();

        return {
            teacherName: resolvedTeacherName,
            weeks: this.buildWeeksFromItems(matchedItems),
        };
    }

    async listBuildings(): Promise<string[]> {
        const rooms = await this.listRooms();
        const buildings = new Set<string>();

        for (const room of rooms) {
            const building = this.getBuildingFromRoom(room);
            if (building) {
                buildings.add(building);
            }
        }

        return BUILDING_OPTIONS.filter((building) => buildings.has(building));
    }

    async listRooms(building?: string): Promise<string[]> {
        const items = await this.baseItemsQuery().getMany();
        const rooms = new Set<string>();

        for (const item of items) {
            const label = formatRoomLabel(item.room);
            if (label && !this.isDistanceRoom(label)) {
                rooms.add(label);
            }
        }

        const roomList = Array.from(rooms).sort((left, right) =>
            left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true }),
        );

        if (!building?.trim()) {
            return roomList;
        }

        const normalizedBuilding = building.trim().toUpperCase();

        return roomList.filter((room) =>
            this.getBuildingFromRoom(room)?.toUpperCase() === normalizedBuilding,
        );
    }

    async getRoomSchedule(roomName: string): Promise<RoomScheduleResponse> {
        const normalizedRoomName = this.normalizeText(roomName);

        const items = await this.baseItemsQuery().getMany();
        const matchedItems = items.filter((item) =>
            this.normalizeText(formatRoomLabel(item.room)) === normalizedRoomName,
        );

        return {
            room: matchedItems[0]
                ? formatRoomLabel(matchedItems[0].room)
                : roomName.trim(),
            weeks: this.buildWeeksFromItems(matchedItems),
        };
    }
}
