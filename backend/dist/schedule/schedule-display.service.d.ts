import { Repository } from 'typeorm';
import { ScheduleItem } from './entities/schedule-item.entity';
import { Schedule } from './entities/schedule.entity';
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
    private readonly itemsRepository;
    private readonly schedulesRepository;
    constructor(itemsRepository: Repository<ScheduleItem>, schedulesRepository: Repository<Schedule>);
    private normalizeText;
    private parseDateValue;
    private formatWeekLabel;
    private buildWeeksFromItems;
    private baseItemsQuery;
    getBuildingFromRoom(room: string): string | null;
    private isDistanceRoom;
    listGroups(): Promise<ScheduleGroupInfo[]>;
    getGroupSchedule(groupName: string): Promise<GroupScheduleResponse>;
    listTeachers(): Promise<string[]>;
    getTeacherSchedule(teacherName: string): Promise<TeacherScheduleResponse>;
    listBuildings(): Promise<string[]>;
    listRooms(building?: string): Promise<string[]>;
    getRoomSchedule(roomName: string): Promise<RoomScheduleResponse>;
}
