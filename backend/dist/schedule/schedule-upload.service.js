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
exports.ScheduleUploadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const typeorm_2 = require("typeorm");
const storage_1 = require("../config/storage");
const schedule_upload_entity_1 = require("./entities/schedule-upload.entity");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const excel_grid_parser_1 = require("./parser/excel-grid.parser");
const schedule_conflict_validator_1 = require("./parser/schedule-conflict.validator");
const schedule_import_service_1 = require("./schedule-import.service");
const schedule_item_mapper_1 = require("./schedule-item.mapper");
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
]);
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv']);
let ScheduleUploadService = class ScheduleUploadService {
    uploadsRepository;
    itemsRepository;
    schedulesRepository;
    scheduleImportService;
    schedulesDir = (0, storage_1.getSchedulesDir)();
    constructor(uploadsRepository, itemsRepository, schedulesRepository, scheduleImportService) {
        this.uploadsRepository = uploadsRepository;
        this.itemsRepository = itemsRepository;
        this.schedulesRepository = schedulesRepository;
        this.scheduleImportService = scheduleImportService;
    }
    async onModuleInit() {
        await (0, promises_1.mkdir)(this.schedulesDir, { recursive: true });
    }
    assertValidUpload(file) {
        if (!file) {
            throw new common_1.BadRequestException('Файл расписания обязателен');
        }
        const extension = (0, node_path_1.extname)(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(extension)) {
            throw new common_1.BadRequestException('Допустимы только файлы Excel (.xlsx, .xls) или CSV');
        }
        if (file.mimetype
            && !ALLOWED_MIME_TYPES.has(file.mimetype)
            && file.mimetype !== 'application/octet-stream') {
            throw new common_1.BadRequestException('Некорректный тип файла. Загрузите Excel или CSV');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new common_1.BadRequestException('Размер файла не должен превышать 20 МБ');
        }
    }
    parseScheduleType(value) {
        const scheduleType = String(value ?? '').trim();
        if (!Object.values(schedule_entity_1.ScheduleType).includes(scheduleType)) {
            throw new common_1.BadRequestException('Некорректный тип расписания');
        }
        return scheduleType;
    }
    parseRequiredGroupName(value) {
        const groupName = String(value ?? '').trim();
        if (!groupName) {
            throw new common_1.BadRequestException('Выберите группу перед загрузкой');
        }
        return groupName;
    }
    parseFacultyName(value) {
        const facultyName = String(value ?? '').trim();
        if (!facultyName) {
            throw new common_1.BadRequestException('Выберите факультет перед загрузкой');
        }
        return facultyName;
    }
    normalizeGroupName(value) {
        return value.trim().toUpperCase();
    }
    toDate(value) {
        const [day, month, year] = value.split('.');
        const pad = (part) => part.padStart(2, '0');
        return `${year}-${pad(month)}-${pad(day)}`;
    }
    assertGroupMatches(expectedGroupName, parsedGroupName) {
        if (this.normalizeGroupName(expectedGroupName) !== this.normalizeGroupName(parsedGroupName)) {
            throw new common_1.BadRequestException({
                message: 'Группа в файле не совпадает с выбранной',
                errors: [
                    `Выбрана группа: ${expectedGroupName}`,
                    `В файле указана группа: ${parsedGroupName}`,
                ],
            });
        }
    }
    assertPeriodDefined(periodStart, periodEnd) {
        if (!periodStart || !periodEnd) {
            throw new common_1.BadRequestException({
                message: 'В шапке файла не найден период расписания',
                errors: [
                    'Добавьте в шапку Excel период, например: на период с 01.09.26г. по 10.10.26г.',
                ],
            });
        }
    }
    async findPeriodUploads(groupName, periodStart, periodEnd) {
        return this.uploadsRepository.find({
            where: {
                groupName,
                periodStart,
                periodEnd,
                parseStatus: schedule_upload_entity_1.ScheduleParseStatus.SUCCESS,
            },
            select: ['id', 'storedFileName'],
        });
    }
    async deleteSchedulesByUploadIds(uploadIds) {
        if (uploadIds.length === 0) {
            return;
        }
        await this.schedulesRepository.delete({
            uploadId: (0, typeorm_2.In)(uploadIds),
        });
    }
    async removeUploads(uploads) {
        const uploadIds = uploads.map((upload) => upload.id);
        await this.deleteSchedulesByUploadIds(uploadIds);
        for (const obsoleteUpload of uploads) {
            const obsoletePath = (0, node_path_1.join)(this.schedulesDir, obsoleteUpload.storedFileName);
            try {
                await (0, promises_1.unlink)(obsoletePath);
            }
            catch {
            }
        }
        if (uploads.length > 0) {
            await this.uploadsRepository.delete({
                id: (0, typeorm_2.In)(uploadIds),
            });
        }
    }
    toResponse(upload) {
        return {
            id: upload.id,
            scheduleType: upload.scheduleType,
            originalFileName: upload.originalFileName,
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
    async loadScheduleItems(excludeUploadIds = [], groupName, excludePeriod) {
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
            qb.andWhere('(schedule.uploadId IS NULL OR schedule.uploadId NOT IN (:...excludeUploadIds))', { excludeUploadIds });
        }
        if (excludePeriod) {
            qb.andWhere('NOT (schedule.validFrom = :validFrom AND schedule.validTo = :validTo)', excludePeriod);
        }
        return qb.getMany();
    }
    async loadExistingLessons(groupName, excludeUploadIds = [], excludePeriod) {
        const items = await this.loadScheduleItems(excludeUploadIds, groupName, excludePeriod);
        return items.map((item) => (0, schedule_item_mapper_1.mapItemToLessonSlot)(item));
    }
    async loadOtherGroupsLessons(groupName, excludeUploadIds = []) {
        const normalizedGroupName = this.normalizeGroupName(groupName);
        const items = await this.loadScheduleItems(excludeUploadIds);
        return items
            .filter((item) => this.normalizeGroupName(item.schedule.group?.name ?? '') !== normalizedGroupName)
            .map((item) => (0, schedule_item_mapper_1.mapItemToLessonSlot)(item));
    }
    async listUploads() {
        const uploads = await this.uploadsRepository.find({
            relations: ['uploadedBy'],
            order: { uploadedAt: 'DESC' },
        });
        for (const upload of uploads) {
            if (upload.parseStatus !== schedule_upload_entity_1.ScheduleParseStatus.SUCCESS) {
                continue;
            }
            const importWarnings = await this.scheduleImportService.refreshUploadReferences(upload.id);
            const mergedWarnings = schedule_import_service_1.ScheduleImportService.mergeStoredWarnings(upload.parseWarnings, importWarnings);
            const nextWarnings = mergedWarnings.length > 0 ? mergedWarnings : null;
            if (JSON.stringify(upload.parseWarnings ?? []) !== JSON.stringify(nextWarnings ?? [])) {
                upload.parseWarnings = nextWarnings;
                await this.uploadsRepository.save(upload);
            }
        }
        return uploads.map((upload) => this.toResponse(upload));
    }
    async uploadSchedule(uploadedById, scheduleTypeRaw, expectedGroupNameRaw, facultyNameRaw, file) {
        this.assertValidUpload(file);
        const scheduleType = this.parseScheduleType(scheduleTypeRaw);
        const expectedGroupName = this.parseRequiredGroupName(expectedGroupNameRaw);
        const facultyName = this.parseFacultyName(facultyNameRaw);
        const extension = (0, node_path_1.extname)(file.originalname).toLowerCase();
        if (extension === '.csv') {
            throw new common_1.BadRequestException('Парсер поддерживает только Excel (.xlsx, .xls). Загрузите файл в формате Excel.');
        }
        const parsed = (0, excel_grid_parser_1.parseScheduleWorkbook)(file.buffer);
        this.assertGroupMatches(expectedGroupName, parsed.groupName);
        this.assertPeriodDefined(parsed.periodStart, parsed.periodEnd);
        const obsoleteUploads = await this.findPeriodUploads(parsed.groupName, parsed.periodStart, parsed.periodEnd);
        const obsoleteUploadIds = obsoleteUploads.map((upload) => upload.id);
        const excludePeriod = {
            validFrom: this.toDate(parsed.periodStart),
            validTo: this.toDate(parsed.periodEnd),
        };
        const existingSameGroupLessons = await this.loadExistingLessons(parsed.groupName, obsoleteUploadIds, excludePeriod);
        const otherGroupsLessons = await this.loadOtherGroupsLessons(parsed.groupName, obsoleteUploadIds);
        const conflicts = (0, schedule_conflict_validator_1.validateScheduleConflicts)(parsed.lessons, [...existingSameGroupLessons, ...otherGroupsLessons]);
        if (conflicts.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Загрузка отменена: обнаружены конфликты в расписании',
                errors: conflicts.map((conflict) => conflict.message),
                warnings: parsed.warnings,
                groupName: parsed.groupName,
                periodStart: parsed.periodStart,
                periodEnd: parsed.periodEnd,
                lessonsFound: parsed.lessons.length,
            });
        }
        const storedFileName = `${Date.now()}-${(0, node_crypto_1.randomBytes)(8).toString('hex')}${extension}`;
        const filePath = (0, node_path_1.join)(this.schedulesDir, storedFileName);
        const fileUrl = `/uploads/schedules/${storedFileName}`;
        await (0, promises_1.writeFile)(filePath, file.buffer);
        await this.removeUploads(obsoleteUploads);
        const upload = this.uploadsRepository.create({
            scheduleType,
            originalFileName: file.originalname,
            storedFileName,
            fileUrl,
            mimeType: file.mimetype || 'application/octet-stream',
            fileSize: file.size,
            groupName: parsed.groupName,
            facultyName,
            parseStatus: schedule_upload_entity_1.ScheduleParseStatus.SUCCESS,
            parseErrors: null,
            parseWarnings: parsed.warnings.length > 0 ? parsed.warnings : null,
            lessonsCount: parsed.lessons.length,
            periodStart: parsed.periodStart,
            periodEnd: parsed.periodEnd,
            uploadedById,
        });
        const savedUpload = await this.uploadsRepository.save(upload);
        const importResult = await this.scheduleImportService.importParsedSchedule(parsed, savedUpload);
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
            throw new common_1.NotFoundException('Загруженный файл не найден');
        }
        return this.toResponse(uploadWithUser);
    }
    async deleteUpload(id) {
        const upload = await this.uploadsRepository.findOne({ where: { id } });
        if (!upload) {
            throw new common_1.NotFoundException('Файл не найден');
        }
        await this.deleteSchedulesByUploadIds([id]);
        const filePath = (0, node_path_1.join)(this.schedulesDir, upload.storedFileName);
        try {
            await (0, promises_1.unlink)(filePath);
        }
        catch {
        }
        await this.uploadsRepository.delete(id);
    }
};
exports.ScheduleUploadService = ScheduleUploadService;
exports.ScheduleUploadService = ScheduleUploadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(schedule_upload_entity_1.ScheduleUpload)),
    __param(1, (0, typeorm_1.InjectRepository)(schedule_item_entity_1.ScheduleItem)),
    __param(2, (0, typeorm_1.InjectRepository)(schedule_entity_1.Schedule)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        schedule_import_service_1.ScheduleImportService])
], ScheduleUploadService);
//# sourceMappingURL=schedule-upload.service.js.map