import { Repository } from 'typeorm';
import { ParsedScheduleLesson } from './entities/parsed-schedule-lesson.entity';
import { ScheduleUpload } from './entities/schedule-upload.entity';
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
export declare class ScheduleDisplayService {
    private readonly parsedLessonsRepository;
    private readonly uploadsRepository;
    constructor(parsedLessonsRepository: Repository<ParsedScheduleLesson>, uploadsRepository: Repository<ScheduleUpload>);
    private normalizeText;
    private parseDateValue;
    private formatWeekLabel;
    private formatTime;
    private formatRoom;
    private mapLesson;
    private buildWeeksFromLessons;
    getBuildingFromRoom(room: string): string | null;
    private isDistanceRoom;
    private getDistinctRooms;
    listGroups(): Promise<ScheduleGroupInfo[]>;
    getGroupSchedule(groupName: string): Promise<GroupScheduleResponse>;
    listTeachers(): Promise<string[]>;
    getTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse>;
    listBuildings(): Promise<string[]>;
    listRooms(building?: string): Promise<string[]>;
    getRoomSchedule(roomName: string): Promise<RoomScheduleResponse>;
}
