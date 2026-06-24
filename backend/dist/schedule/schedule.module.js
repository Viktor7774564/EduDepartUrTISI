"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const users_module_1 = require("../users/users.module");
const schedule_entity_1 = require("./entities/schedule.entity");
const schedule_item_entity_1 = require("./entities/schedule-item.entity");
const schedule_upload_entity_1 = require("./entities/schedule-upload.entity");
const parsed_schedule_lesson_entity_1 = require("./entities/parsed-schedule-lesson.entity");
const room_entity_1 = require("./entities/room.entity");
const lesson_type_entity_1 = require("./entities/lesson-type.entity");
const education_department_guard_1 = require("./guards/education-department.guard");
const schedule_display_controller_1 = require("./schedule-display.controller");
const schedule_display_service_1 = require("./schedule-display.service");
const schedule_upload_controller_1 = require("./schedule-upload.controller");
const schedule_upload_service_1 = require("./schedule-upload.service");
let ScheduleModule = class ScheduleModule {
};
exports.ScheduleModule = ScheduleModule;
exports.ScheduleModule = ScheduleModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([
                schedule_entity_1.Schedule,
                schedule_item_entity_1.ScheduleItem,
                schedule_upload_entity_1.ScheduleUpload,
                parsed_schedule_lesson_entity_1.ParsedScheduleLesson,
                room_entity_1.Room,
                lesson_type_entity_1.LessonType,
            ]),
        ],
        controllers: [schedule_upload_controller_1.ScheduleUploadController, schedule_display_controller_1.ScheduleDisplayController],
        providers: [schedule_upload_service_1.ScheduleUploadService, schedule_display_service_1.ScheduleDisplayService, education_department_guard_1.EducationDepartmentGuard],
        exports: [typeorm_1.TypeOrmModule],
    })
], ScheduleModule);
//# sourceMappingURL=schedule.module.js.map