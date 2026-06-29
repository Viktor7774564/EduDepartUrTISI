import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ScheduleParseStatus, ScheduleUpload } from './entities/schedule-upload.entity';
import { Schedule, ScheduleType } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { ScheduleImportService } from './schedule-import.service';
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
    private readonly itemsRepository;
    private readonly schedulesRepository;
    private readonly scheduleImportService;
    private readonly schedulesDir;
    constructor(uploadsRepository: Repository<ScheduleUpload>, itemsRepository: Repository<ScheduleItem>, schedulesRepository: Repository<Schedule>, scheduleImportService: ScheduleImportService);
    onModuleInit(): Promise<void>;
    private assertValidUpload;
    private parseScheduleType;
    private parseRequiredGroupName;
    private parseFacultyName;
    private normalizeGroupName;
    private toDate;
    private assertGroupMatches;
    private assertPeriodDefined;
    private parseUploadedWorkbook;
    private findPeriodUploads;
    private deleteSchedulesByUploadIds;
    private removeUploads;
    private toResponse;
    private loadScheduleItems;
    private loadExistingLessons;
    private loadOtherGroupsLessons;
    listUploads(): Promise<ScheduleUploadResponse[]>;
    uploadSchedule(uploadedById: number, scheduleTypeRaw: unknown, expectedGroupNameRaw: unknown, facultyNameRaw: unknown, file: Express.Multer.File | undefined): Promise<ScheduleUploadResponse>;
    deleteUpload(id: number): Promise<void>;
}
