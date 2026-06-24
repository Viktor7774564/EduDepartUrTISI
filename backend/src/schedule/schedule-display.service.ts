import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ParsedScheduleLesson } from './entities/parsed-schedule-lesson.entity';
import { ScheduleParseStatus, ScheduleUpload } from './entities/schedule-upload.entity';
import { ScheduleType } from './entities/schedule.entity';

const DAY_LABELS: Record<number, string> = {
    1: 'ПН',
    2: 'ВТ',
    3: 'СР',
    4: 'ЧТ',
    5: 'ПТ',
    6: 'СБ',
    7: 'ВС',
};

const BUILDING_OPTIONS = ['УК1', 'УК2', 'УК3', 'УК4', 'УК5'] as const;

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
        @InjectRepository(ParsedScheduleLesson)
        private readonly parsedLessonsRepository: Repository<ParsedScheduleLesson>,
        @InjectRepository(ScheduleUpload)
        private readonly uploadsRepository: Repository<ScheduleUpload>,
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

    private formatTime(value: string): string {
        return value.slice(0, 5);
    }

    private formatRoom(lesson: ParsedScheduleLesson): string {
        if (lesson.room?.trim()) {
            return lesson.room.trim();
        }

        if (lesson.isDistance) {
            return 'дист. форм. об.';
        }

        return '';
    }

    private mapLesson(lesson: ParsedScheduleLesson): ScheduleDisplayLesson {
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

    private buildWeeksFromLessons(lessons: ParsedScheduleLesson[]): Record<string, ScheduleDisplayLesson[]> {
        const weeks = new Map<string, ScheduleDisplayLesson[]>();
        const weekOrder: string[] = [];

        for (const lesson of lessons) {
            const weekLabel = this.formatWeekLabel(String(lesson.weekStart));

            if (!weeks.has(weekLabel)) {
                weeks.set(weekLabel, []);
                weekOrder.push(weekLabel);
            }

            weeks.get(weekLabel)?.push(this.mapLesson(lesson));
        }

        const orderedWeeks: Record<string, ScheduleDisplayLesson[]> = {};

        for (const weekLabel of weekOrder) {
            orderedWeeks[weekLabel] = weeks.get(weekLabel) ?? [];
        }

        return orderedWeeks;
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

    private async getDistinctRooms(): Promise<string[]> {
        const rows = await this.parsedLessonsRepository
            .createQueryBuilder('lesson')
            .select('DISTINCT lesson.room', 'room')
            .where('lesson.room IS NOT NULL')
            .andWhere("TRIM(lesson.room) <> ''")
            .getRawMany<{ room: string }>();

        return rows
            .map((row) => row.room?.trim())
            .filter((room): room is string => Boolean(room) && !this.isDistanceRoom(room))
            .sort((left, right) => left.localeCompare(right, 'ru', { sensitivity: 'base', numeric: true }));
    }

    async listGroups(): Promise<ScheduleGroupInfo[]> {
        const uploads = await this.uploadsRepository.find({
            where: {
                parseStatus: ScheduleParseStatus.SUCCESS,
                scheduleType: ScheduleType.STUDENT,
            },
            select: ['groupName', 'facultyName'],
            order: { uploadedAt: 'DESC' },
        });

        const groups = new Map<string, ScheduleGroupInfo>();

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

        return Array.from(groups.values()).sort((left, right) =>
            left.groupName.localeCompare(right.groupName, 'ru', {
                sensitivity: 'base',
                numeric: true,
            }),
        );
    }

    async getGroupSchedule(groupName: string): Promise<GroupScheduleResponse> {
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

    async listTeachers(): Promise<string[]> {
        const rows = await this.parsedLessonsRepository
            .createQueryBuilder('lesson')
            .select('DISTINCT lesson.teacherName', 'teacherName')
            .where("TRIM(lesson.teacherName) <> ''")
            .orderBy('lesson.teacherName', 'ASC')
            .getRawMany<{ teacherName: string }>();

        return rows
            .map((row) => row.teacherName?.trim())
            .filter((teacher): teacher is string => Boolean(teacher));
    }

    async getTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse> {
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

    async listBuildings(): Promise<string[]> {
        const rooms = await this.getDistinctRooms();
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
        const rooms = await this.getDistinctRooms();

        if (!building?.trim()) {
            return rooms;
        }

        const normalizedBuilding = building.trim().toUpperCase();

        return rooms.filter((room) => this.getBuildingFromRoom(room)?.toUpperCase() === normalizedBuilding);
    }

    async getRoomSchedule(roomName: string): Promise<RoomScheduleResponse> {
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
}
