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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsedScheduleLesson = void 0;
const typeorm_1 = require("typeorm");
const schedule_upload_entity_1 = require("./schedule-upload.entity");
let ParsedScheduleLesson = class ParsedScheduleLesson {
    id;
    uploadId;
    upload;
    groupName;
    dayOfWeek;
    startTime;
    endTime;
    weekStart;
    subgroup;
    subject;
    lessonType;
    teacherPosition;
    teacherName;
    room;
    isDistance;
    isSameCellParallel;
};
exports.ParsedScheduleLesson = ParsedScheduleLesson;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ParsedScheduleLesson.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ParsedScheduleLesson.prototype, "uploadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => schedule_upload_entity_1.ScheduleUpload, (upload) => upload.parsedLessons, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'uploadId' }),
    __metadata("design:type", schedule_upload_entity_1.ScheduleUpload)
], ParsedScheduleLesson.prototype, "upload", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ParsedScheduleLesson.prototype, "groupName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint' }),
    __metadata("design:type", Number)
], ParsedScheduleLesson.prototype, "dayOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ParsedScheduleLesson.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ParsedScheduleLesson.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], ParsedScheduleLesson.prototype, "weekStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'smallint', nullable: true }),
    __metadata("design:type", Object)
], ParsedScheduleLesson.prototype, "subgroup", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ParsedScheduleLesson.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ParsedScheduleLesson.prototype, "lessonType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ParsedScheduleLesson.prototype, "teacherPosition", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ParsedScheduleLesson.prototype, "teacherName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], ParsedScheduleLesson.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ParsedScheduleLesson.prototype, "isDistance", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ParsedScheduleLesson.prototype, "isSameCellParallel", void 0);
exports.ParsedScheduleLesson = ParsedScheduleLesson = __decorate([
    (0, typeorm_1.Entity)('parsed_schedule_lessons')
], ParsedScheduleLesson);
//# sourceMappingURL=parsed-schedule-lesson.entity.js.map