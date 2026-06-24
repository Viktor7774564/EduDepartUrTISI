import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ParsedScheduleLesson } from './entities/parsed-schedule-lesson.entity';
import { ScheduleParseStatus, ScheduleUpload } from './entities/schedule-upload.entity';
import { ScheduleType } from './entities/schedule.entity';
export interface ScheduleUploadResponse {
    id: number;
    scheduleType: ScheduleType;
    originalFileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    groupName: string | null;
    facultyName: string | null;
    parseStatus: ScheduleParseStatus;
    parseErrors: string[] | null;
    parseWarnings: string[] | null;
    lessonsCount: number;
    periodStart: string | null;
    periodEnd: string | null;
    uploadedAt: string;
    uploadedBy: {
        id: number;
        surname: string;
        name: string;
        patronymic: string;
    };
}
export declare class ScheduleUploadService implements OnModuleInit {
    private readonly uploadsRepository;
    private readonly parsedLessonsRepository;
    private readonly schedulesDir;
    constructor(uploadsRepository: Repository<ScheduleUpload>, parsedLessonsRepository: Repository<ParsedScheduleLesson>);
    onModuleInit(): Promise<void>;
    private assertValidUpload;
    private parseScheduleType;
    private parseRequiredGroupName;
    private parseFacultyName;
    private normalizeGroupName;
    private assertGroupMatches;
    private assertPeriodDefined;
    private findPeriodUploads;
    private removeUploads;
    private toResponse;
    private mapParsedLesson;
    private mapLessonSlot;
    private loadExistingLessons;
    private loadOtherGroupsLessons;
    listUploads(): Promise<ScheduleUploadResponse[]>;
    uploadSchedule(uploadedById: number, scheduleTypeRaw: unknown, expectedGroupNameRaw: unknown, facultyNameRaw: unknown, file: Express.Multer.File | undefined): Promise<ScheduleUploadResponse>;
    deleteUpload(id: number): Promise<void>;
}
