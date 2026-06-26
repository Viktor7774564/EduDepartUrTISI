"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkloadLimit = void 0;
const typeorm_1 = require("typeorm");
let WorkloadLimit = class WorkloadLimit {
    id;
    groupId;
    FK;
    groups;
    group;
    ManyToOne;
    Group;
    subjectId;
    FK;
    subjects;
    subject;
    ManyToOne;
    Subject;
    lessonTypeId;
    FK;
    lesson_types;
    lessonType;
    ManyToOne;
    LessonType;
    teacherId;
    FK;
    users;
    nullable;
    teacher;
    ManyToOne;
    User;
    nullable;
    academicYear;
    varchar;
    semester;
    smallint;
    plannedHours;
    uploadId;
    FK;
    workload_uploads;
    nullable;
    onDelete;
    SET;
    NULL;
    upload;
    ManyToOne;
    WorkloadUpload;
};
exports.WorkloadLimit = WorkloadLimit;
exports.WorkloadLimit = WorkloadLimit = __decorate([
    (0, typeorm_1.Entity)('workload_limits'),
    (0, typeorm_1.Unique)(['groupId', 'subjectId', 'lessonTypeId', 'academicYear', 'semester'])
], WorkloadLimit);
//# sourceMappingURL=workload-limit.entity.js.map