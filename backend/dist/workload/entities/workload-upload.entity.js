"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkloadUpload = void 0;
const typeorm_1 = require("typeorm");
let WorkloadUpload = class WorkloadUpload {
    id;
    originalFileName;
    storedFileName;
    fileUrl;
    mimeType;
    fileSize;
    academicYear;
    course;
    groupNames;
    parseStatus;
    parseErrors;
    parseWarnings;
    limitsCount;
    uploadedById;
    uploadedBy;
    ManyToOne;
    User;
    uploadedAt;
    CreateDateColumn;
};
exports.WorkloadUpload = WorkloadUpload;
exports.WorkloadUpload = WorkloadUpload = __decorate([
    (0, typeorm_1.Entity)('workload_uploads')
], WorkloadUpload);
//# sourceMappingURL=workload-upload.entity.js.map