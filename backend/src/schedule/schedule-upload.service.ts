import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { randomBytes } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { In, Repository } from 'typeorm';

import { getSchedulesDir } from '../config/storage';
import { ScheduleParseStatus, ScheduleUpload } from './entities/schedule-upload.entity';
import { Schedule, ScheduleType } from './entities/schedule.entity';
import { ScheduleItem } from './entities/schedule-item.entity';
import { parseScheduleWorkbook, type ParseScheduleResult } from './parser/excel-grid.parser';
import {
    ScheduleLessonSlot,
    validateScheduleConflicts,
} from './parser/schedule-conflict.validator';
import { ScheduleImportService } from './schedule-import.service';
import { mapItemToLessonSlot } from './schedule-item.mapper';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
]);

const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv']);

function decodeUploadedFilename(name: string): string {
    if (/[\u0400-\u04FF]/.test(name)) {
        return name;
    }

    try {
        return Buffer.from(name, 'latin1').toString('utf8');
    } catch {
        return name;
    }
}

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

@Injectable()
export class ScheduleUploadService implements OnModuleInit {
    private readonly schedulesDir = getSchedulesDir();

    constructor(
        @InjectRepository(ScheduleUpload)
        private readonly uploadsRepository: Repository<ScheduleUpload>,
        @InjectRepository(ScheduleItem)
        private readonly itemsRepository: Repository<ScheduleItem>,
        @InjectRepository(Schedule)
        private readonly schedulesRepository: Repository<Schedule>,
        private readonly scheduleImportService: ScheduleImportService,
    ) {}

    async onModuleInit() {
        await mkdir(this.schedulesDir, { recursive: true });
    }

    private assertValidUpload(file?: Express.Multer.File): asserts file is Express.Multer.File {
        if (!file) {
            throw new BadRequestException('Файл расписания обязателен');
        }

        const extension = extname(decodeUploadedFilename(file.originalname)).toLowerCase();

        if (!ALLOWED_EXTENSIONS.has(extension)) {
            throw new BadRequestException(
                'Допустимы только файлы Excel (.xlsx, .xls) или CSV',
            );
        }

        if (
            file.mimetype
            && !ALLOWED_MIME_TYPES.has(file.mimetype)
            && file.mimetype !== 'application/octet-stream'
        ) {
            throw new BadRequestException(
                'Некорректный тип файла. Загрузите Excel или CSV',
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(
                'Размер файла не должен превышать 20 МБ',
            );
        }
    }

    private parseScheduleType(value: unknown): ScheduleType {
        const scheduleType = String(value ?? '').trim();

        if (!Object.values(ScheduleType).includes(scheduleType as ScheduleType)) {
            throw new BadRequestException('Некорректный тип расписания');
        }

        return scheduleType as ScheduleType;
    }

    private parseRequiredGroupName(value: unknown): string {
        const groupName = String(value ?? '').trim();

        if (!groupName) {
            throw new BadRequestException('Выберите группу перед загрузкой');
        }

        return groupName;
    }

    private parseFacultyName(value: unknown): string {
        const facultyName = String(value ?? '').trim();

        if (!facultyName) {
            throw new BadRequestException('Выберите факультет перед загрузкой');
        }

        return facultyName;
    }

    private normalizeGroupName(value: string): string {
        return value.trim().toUpperCase();
    }

    private toDate(value: string): string {
        const [day, month, year] = value.split('.');
        const pad = (part: string) => part.padStart(2, '0');

        return `${year}-${pad(month)}-${pad(day)}`;
    }

    private assertGroupMatches(expectedGroupName: string, parsedGroupName: string): void {
        if (this.normalizeGroupName(expectedGroupName) !== this.normalizeGroupName(parsedGroupName)) {
            throw new BadRequestException({
                message: 'Группа в файле не совпадает с выбранной',
                errors: [
                    `Выбрана группа: ${expectedGroupName}`,
                    `В файле указана группа: ${parsedGroupName}`,
                ],
            });
        }
    }

    private assertPeriodDefined(periodStart: string | null, periodEnd: string | null): void {
        if (!periodStart || !periodEnd) {
            throw new BadRequestException({
                message: 'В шапке файла не найден период расписания',
                errors: [
                    'Добавьте в шапку Excel период, например: на период с 01.09.26г. по 10.10.26г.',
                ],
            });
        }
    }

    private parseUploadedWorkbook(buffer: Buffer): ParseScheduleResult {
        try {
            return parseScheduleWorkbook(buffer);
        } catch (error) {
            const parseError = error instanceof Error && error.message
                ? error.message
                : 'Не удалось разобрать файл расписания';

            throw new BadRequestException({
                message: 'Не удалось разобрать файл расписания',
                errors: [parseError],
            });
        }
    }

    private async findPeriodUploads(
        uploadedById: number,
        groupName: string,
        periodStart: string,
        periodEnd: string,
    ): Promise<ScheduleUpload[]> {
        return this.uploadsRepository.find({
            where: {
                uploadedById,
                groupName,
                periodStart,
                periodEnd,
                parseStatus: ScheduleParseStatus.SUCCESS,
            },
            select: ['id', 'storedFileName'],
        });
    }

    private async deleteSchedulesByUploadIds(uploadIds: number[]): Promise<void> {
        if (uploadIds.length === 0) {
            return;
        }

        await this.schedulesRepository.delete({
            uploadId: In(uploadIds),
        });
    }

    private async findLatestAlternativeUpload(
        groupName: string,
        periodStart: string,
        periodEnd: string,
        excludeUploadId: number,
    ): Promise<ScheduleUpload | null> {
        return this.uploadsRepository
            .createQueryBuilder('upload')
            .where('upload.groupName = :groupName', { groupName })
            .andWhere('upload.periodStart = :periodStart', { periodStart })
            .andWhere('upload.periodEnd = :periodEnd', { periodEnd })
            .andWhere('upload.parseStatus = :status', { status: ScheduleParseStatus.SUCCESS })
            .andWhere('upload.id != :excludeUploadId', { excludeUploadId })
            .orderBy('upload.uploadedAt', 'DESC')
            .getOne();
    }

    private async reimportFromStoredUpload(upload: ScheduleUpload): Promise<void> {
        const filePath = join(this.schedulesDir, upload.storedFileName);
        const buffer = await readFile(filePath);
        const parsed = parseScheduleWorkbook(buffer);
        const importResult = await this.scheduleImportService.importParsedSchedule(
            parsed,
            upload,
        );

        upload.lessonsCount = importResult.itemsCount;
        upload.parseWarnings = importResult.warnings.length > 0
            ? importResult.warnings
            : null;
        await this.uploadsRepository.save(upload);
    }

    private async handleOwnedSchedulesBeforeUploadDelete(upload: ScheduleUpload): Promise<void> {
        const ownedSchedule = await this.schedulesRepository.findOne({
            where: { uploadId: upload.id },
        });

        if (!ownedSchedule) {
            return;
        }

        if (!upload.groupName || !upload.periodStart || !upload.periodEnd) {
            await this.deleteSchedulesByUploadIds([upload.id]);
            return;
        }

        const alternativeUpload = await this.findLatestAlternativeUpload(
            upload.groupName,
            upload.periodStart,
            upload.periodEnd,
            upload.id,
        );

        if (!alternativeUpload) {
            await this.deleteSchedulesByUploadIds([upload.id]);
            return;
        }

        try {
            await this.reimportFromStoredUpload(alternativeUpload);
        } catch {
            await this.deleteSchedulesByUploadIds([upload.id]);
        }
    }

    private async removeUploads(uploads: Pick<ScheduleUpload, 'id' | 'storedFileName'>[]): Promise<void> {
        const uploadIds = uploads.map((upload) => upload.id);

        await this.deleteSchedulesByUploadIds(uploadIds);

        for (const obsoleteUpload of uploads) {
            const obsoletePath = join(this.schedulesDir, obsoleteUpload.storedFileName);
            try {
                await unlink(obsoletePath);
            } catch {
                // Файл уже удалён.
            }
        }

        if (uploads.length > 0) {
            await this.uploadsRepository.delete({
                id: In(uploadIds),
            });
        }
    }

    private toResponse(upload: ScheduleUpload): ScheduleUploadResponse {
        return {
            id: upload.id,
            scheduleType: upload.scheduleType,
            originalFileName: decodeUploadedFilename(upload.originalFileName),
            fileUrl: upload.fileUrl,
            mimeType: upload.mimeType,
            fileSize: upload.fileSize,
            groupName: upload.groupName,
            facultyName: upload.facultyName,
            parseStatus: upload.parseStatus,
            parseErrors: upload.parseErrors,
            parseWarnings: upload.parseWarnings,
            lessonsCount: upload.lessonsCount,
            periodStart: upload.periodStart,
            periodEnd: upload.periodEnd,
            uploadedAt: upload.uploadedAt.toISOString(),
            uploadedBy: {
                id: upload.uploadedBy.id,
                surname: upload.uploadedBy.surname,
                name: upload.uploadedBy.name,
                patronymic: upload.uploadedBy.patronymic,
            },
        };
    }

    private async loadScheduleItems(
        excludeUploadIds: number[] = [],
        groupName?: string,
        excludePeriod?: { validFrom: string; validTo: string },
    ): Promise<ScheduleItem[]> {
        const qb = this.itemsRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.schedule', 'schedule')
            .innerJoinAndSelect('schedule.group', 'group')
            .leftJoinAndSelect('item.subject', 'subject')
            .leftJoinAndSelect('item.subgroup', 'subgroup')
            .leftJoinAndSelect('item.lessonType', 'lessonType')
            .leftJoinAndSelect('item.teacher', 'teacher')
            .leftJoinAndSelect('item.room', 'room')
            .where('item.isDisabled = false')
            .andWhere('schedule.isActive = true');

        if (groupName) {
            qb.andWhere('UPPER(TRIM(group.name)) = :groupName', {
                groupName: this.normalizeGroupName(groupName),
            });
        }

        if (excludeUploadIds.length > 0) {
            qb.andWhere(
                '(schedule.uploadId IS NULL OR schedule.uploadId NOT IN (:...excludeUploadIds))',
                { excludeUploadIds },
            );
        }

        if (excludePeriod) {
            qb.andWhere(
                'NOT (schedule.validFrom = :validFrom AND schedule.validTo = :validTo)',
                excludePeriod,
            );
        }

        return qb.getMany();
    }

    private async loadExistingLessons(
        groupName: string,
        excludeUploadIds: number[] = [],
        excludePeriod?: { validFrom: string; validTo: string },
    ): Promise<ScheduleLessonSlot[]> {
        const items = await this.loadScheduleItems(
            excludeUploadIds,
            groupName,
            excludePeriod,
        );

        return items.map((item) => mapItemToLessonSlot(item));
    }

    private async loadOtherGroupsLessons(
        groupName: string,
        excludeUploadIds: number[] = [],
    ): Promise<ScheduleLessonSlot[]> {
        const normalizedGroupName = this.normalizeGroupName(groupName);

        const items = await this.loadScheduleItems(excludeUploadIds);

        return items
            .filter((item) =>
                this.normalizeGroupName(item.schedule.group?.name ?? '') !== normalizedGroupName,
            )
            .map((item) => mapItemToLessonSlot(item));
    }

    async listUploads(uploadedById: number): Promise<ScheduleUploadResponse[]> {
        const uploads = await this.uploadsRepository.find({
            where: { uploadedById },
            relations: ['uploadedBy'],
            order: { uploadedAt: 'DESC' },
        });

        for (const upload of uploads) {
            if (upload.parseStatus !== ScheduleParseStatus.SUCCESS) {
                continue;
            }

            const importWarnings = await this.scheduleImportService.refreshUploadReferences(
                upload.id,
            );
            const mergedWarnings = ScheduleImportService.mergeStoredWarnings(
                upload.parseWarnings,
                importWarnings,
            );
            const nextWarnings = mergedWarnings.length > 0 ? mergedWarnings : null;

            if (JSON.stringify(upload.parseWarnings ?? []) !== JSON.stringify(nextWarnings ?? [])) {
                upload.parseWarnings = nextWarnings;
                await this.uploadsRepository.save(upload);
            }
        }

        return uploads.map((upload) => this.toResponse(upload));
    }

    async uploadSchedule(
        uploadedById: number,
        scheduleTypeRaw: unknown,
        expectedGroupNameRaw: unknown,
        facultyNameRaw: unknown,
        file: Express.Multer.File | undefined,
    ): Promise<ScheduleUploadResponse> {
        this.assertValidUpload(file);

        const originalFileName = decodeUploadedFilename(file.originalname);
        const scheduleType = this.parseScheduleType(scheduleTypeRaw);
        const expectedGroupName = this.parseRequiredGroupName(expectedGroupNameRaw);
        const facultyName = this.parseFacultyName(facultyNameRaw);
        const extension = extname(originalFileName).toLowerCase();

        if (extension === '.csv') {
            throw new BadRequestException(
                'Парсер поддерживает только Excel (.xlsx, .xls). Загрузите файл в формате Excel.',
            );
        }

        const parsed = this.parseUploadedWorkbook(file.buffer);
        this.assertGroupMatches(expectedGroupName, parsed.groupName);
        this.assertPeriodDefined(parsed.periodStart, parsed.periodEnd);

        const obsoleteUploads = await this.findPeriodUploads(
            uploadedById,
            parsed.groupName,
            parsed.periodStart!,
            parsed.periodEnd!,
        );
        const obsoleteUploadIds = obsoleteUploads.map((upload) => upload.id);
        const excludePeriod = {
            validFrom: this.toDate(parsed.periodStart!),
            validTo: this.toDate(parsed.periodEnd!),
        };

        const existingSameGroupLessons = await this.loadExistingLessons(
            parsed.groupName,
            obsoleteUploadIds,
            excludePeriod,
        );
        const otherGroupsLessons = await this.loadOtherGroupsLessons(
            parsed.groupName,
            obsoleteUploadIds,
        );
        const conflicts = validateScheduleConflicts(
            parsed.lessons,
            [...existingSameGroupLessons, ...otherGroupsLessons],
        );

        if (conflicts.length > 0) {
            throw new BadRequestException({
                message: 'Загрузка отменена: обнаружены конфликты в расписании',
                errors: conflicts.map((conflict) => conflict.message),
                warnings: parsed.warnings,
                groupName: parsed.groupName,
                periodStart: parsed.periodStart,
                periodEnd: parsed.periodEnd,
                lessonsFound: parsed.lessons.length,
            });
        }

        const storedFileName = `${Date.now()}-${randomBytes(8).toString('hex')}${extension}`;
        const filePath = join(this.schedulesDir, storedFileName);
        const fileUrl = `/uploads/schedules/${storedFileName}`;

        await writeFile(filePath, file.buffer);
        await this.removeUploads(obsoleteUploads);

        const upload = this.uploadsRepository.create({
            scheduleType,
            originalFileName,
            storedFileName,
            fileUrl,
            mimeType: file.mimetype || 'application/octet-stream',
            fileSize: file.size,
            groupName: parsed.groupName,
            facultyName,
            parseStatus: ScheduleParseStatus.SUCCESS,
            parseErrors: null,
            parseWarnings: parsed.warnings.length > 0 ? parsed.warnings : null,
            lessonsCount: parsed.lessons.length,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            uploadedById,
        });

        const savedUpload = await this.uploadsRepository.save(upload);

        const importResult = await this.scheduleImportService.importParsedSchedule(
            parsed,
            savedUpload,
        );

        savedUpload.lessonsCount = importResult.itemsCount;
        savedUpload.parseWarnings = importResult.warnings.length > 0
            ? importResult.warnings
            : null;
        await this.uploadsRepository.save(savedUpload);

        const uploadWithUser = await this.uploadsRepository.findOne({
            where: { id: savedUpload.id },
            relations: ['uploadedBy'],
        });

        if (!uploadWithUser) {
            throw new NotFoundException('Загруженный файл не найден');
        }

        return this.toResponse(uploadWithUser);
    }

    async deleteUpload(id: number, uploadedById: number): Promise<void> {
        const upload = await this.uploadsRepository.findOne({ where: { id } });

        if (!upload) {
            throw new NotFoundException('Файл не найден');
        }

        if (upload.uploadedById !== uploadedById) {
            throw new ForbiddenException('Можно удалять только свои загрузки');
        }

        await this.handleOwnedSchedulesBeforeUploadDelete(upload);

        const filePath = join(this.schedulesDir, upload.storedFileName);

        try {
            await unlink(filePath);
        } catch {
            // Файл уже удалён или не существовал.
        }

        await this.uploadsRepository.delete(id);
    }
}